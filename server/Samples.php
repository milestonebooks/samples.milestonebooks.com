<?php

///////////////////////////////////////////////////////////////////////////////////////////////////

// get current directory
define('THIS_DIR',getcwd());

// switch to admin subdomain...
$dir = "/var/www/vhosts/milestonebooks.com/subdomains/admin/httpdocs/";
chdir($dir);

// bootstrap
$dir = preg_replace("'(httpdocs).*$'", "$1", getcwd()) . '/x/libs/classes/';
require_once($dir . '_Object2.php');

// switch back here
chdir(THIS_DIR);

///////////////////////////////////////////////////////////////////////////////////////////////////

// ids may have alternating letter and/or number groups, optionally separated by a hyphen
// the following sequencing is enforced: (lowercase roman numerals) < (uppercase letters) < (numerals) < (uppercase letters and hypen)
// e.g. 'vi' < 'A' < 'T2' < 'T19' < '1' < '1-3' < '1-17' < '14' < '14b' < 'A-1'
// although not required, letters should be uppercase, except for reserved uses (below); ascii uppercase precedes lowercase
// sequentiality is determined by ascii order
// id subgroup intervals are considered non-sequential, except for verso (below) and subgroups that append with a '1' or 'A' (e.g. C, C1...; 5, 5A...)

// EXAMPLES:
// * subgroups:
//   37-859 (Body's Building Blocks TM): ...62, 62A, 62B...
// * hyphenated segments:
//   7-16143 (BSR worksheets): ...C24-1, C24-2, C24-3...
// * verso:
//   1-111824 (Phonics flash cards): 1-1, 1-1b, 2-6, 2-6b...
// * roman numerals:
//   41-3096 (Lenape Homeland): xii, xiii, xiv, 1, 2, 3...
// * mixed segments:
//   45-6639 (Zion's Praises): vi, H1, H336, H337, 849, 850...
//   31-E0 (Christian Ethics): ...167, 168, 169, A-1, A-2, A-3

const ID_REGEX = "'(\d+|[[:alpha:]]+|-)'";

// lower case b is used to indicate the back (following) side of a sample (e.g. 1, 1b, 2, 2b...)
const ID_VERSO = 'b';

// ids for prefaces that use roman numerals should always be lower case; UPPERCASE is reserved for unnumbered samples
const ROMAN_REGEX = "'^[ivxlcdm]+$'";

/*************************************************************************************************/
class Samples extends _Object2 {

  var $version = '2022-01-13';
  var $limit   = false;

  var $code,
    $_dev = '';

  //---------------------------------------------------------------------------------------------

  public function __construct($autorun=false) {
    $this->code = preg_replace("'^/([^/]+).*$'", "$1", $_SERVER['REQUEST_URI']);

    if (!$this->code) return $this->Failure('No item specified.');

    if (DEV) $this->_dev = '.dev';

    if (!isset($_REQUEST['action'])) $_REQUEST['action'] = '__html';

    return parent::__construct($autorun);
  } // __construct()

  //---------------------------------------------------------------------------------------------

  public function __html() {

    $file_html = "_dist{$this->_dev}/_item.html";

    if (file_exists($file_html)) {
      $html = file_get_contents($file_html);
      return $this->Success($html, 'html');
    }

    return $this->Failure("Could not find html source file for item $this->code.", 'html');

  } // __html()

  //---------------------------------------------------------------------------------------------

  public function Data($item_id = null) {

    if (!$item_id || !is_numeric($item_id)) {
      $r = $this->QueryFetch("SELECT id, is_group, is_active FROM a01i_Items WHERE code = '$this->code'");

      if (!$r) return $this->Failure("Could not find '$this->code'");

      $this->limit = $this->get('limit', isset($_REQUEST['limit']) && $_REQUEST['limit'] == 'true');

      // a samples group does not have any directly associated samples
      // an item may be a group on the back end but function as a single item on the front end (e.g. 4-009--L)
      $isGroup = ($r->is_group && !file_exists("items/$this->code") && !file_exists("audio/$this->code"));

      $data = (object)[
        'item_id'     => (int)$r->id,
        'code'        => $this->code,
        'isGroup'     => $isGroup,
        'seriesIndex' => 0,
      ];

      $data->series = $this->GetSeries($data);

      foreach ($data->series->items as $index => $item) {
        if ($item->item_id == $data->item_id) $data->seriesIndex = $index;
      }

      return $data;
    }

    $SAMPLES_CLASS_FIELD_ID = 11;

    $sql = "SELECT i.id AS item_id, i.is_active, i.code, i.label AS title, iv.value AS samples_class,
                    img.fileName AS img_file, img.width AS img_w, img.height AS img_h
                FROM milestone.a01i_Items i
                LEFT JOIN a01i_ItemsXValues iv ON (iv.id = i.id AND iv.field_id = $SAMPLES_CLASS_FIELD_ID)
                LEFT JOIN xcart.xc_product_images img ON (img.product_id = i.id)
                WHERE i.id = $item_id";

    $r = $this->QueryFetch($sql);

    $code = $r->code;

    $spine = 'none';

    if ($r->samples_class == 'book' || $r->samples_class == 'libro') $spine = 'left';
    if (substr_count($r->samples_class, 'spine-top'))   $spine = 'top';
    if (substr_count($r->samples_class, 'spine-right')) $spine = 'right';

    if (!$r->img_file) {
      $this->SendMsg([
        'msg' => "Samples Alert: $code has no image",
        'prevent_duplicate' => '1 week',
      ]);

      $r->img_file = 'BLANK.jpg';
      $r->img_w    = 300;
      $r->img_h    = 300;
    }

    $data = (object)[
      'item_id'  => $item_id,
      'code'     => $code,
      'title'    => $r->title,
      'type'     => (file_exists("audio/$code") ? 'audio' : 'items'),
      'spine'    => $spine,
      'image'    => (object)[
        'file' => $r->img_file,
        'w'    => (int)$r->img_w,
        'h'    => (int)$r->img_h,
      ],
    ];

    if (!$r->is_active) {
      $data->isInactive = true;
    }

    $data->samples = $this->GetSamples($data);

    if (substr_count($data->title, 'Arabic ') || substr_count($data->title, 'Hebrew ')) {
      $data->direction = 'rtl';
    }

    $data = $this->IncludeSampleData($data);

    if (!count($data->samples)) {
      $this->SendMsg([
        'subject' => "Samples Alert: $code has no samples",
        'msg'     => "Samples Alert: $code has no samples ($this->code)",
        'prevent_duplicate' => '1 month',
      ]);
    } else if (!$r->samples_class) {
      $this->SendMsg([
        'msg' => "Samples Alert: $code has no samples class",
        'prevent_duplicate' => '1 week',
      ]);
    }

    return $data;

  } // Data()

  //---------------------------------------------------------------------------------------------

  private function GetSeries($data): object {

    $item_id = $data->item_id;

    $series = (object)[
      'id'      => null,
      'item_id' => null,
      'code'    => null,
      'title'   => null,
      'items'   => [],
    ];

    $res = null;

    if (!$data->isGroup) {
      $sql = "SELECT i.id AS item_id
                    FROM a01i_SeriesItems si
                    LEFT JOIN a01i_SeriesItems series ON (series.series_id = si.series_id)
                    LEFT JOIN a01i_Items i ON (i.id = series.item_id)
                    WHERE si.item_id = $item_id
                    ORDER BY series.sort_order";

      $res = $this->Query($sql);
    }

    if ($res && $res->num_rows) {
      $series->id = (int)$this->QueryFetchField("SELECT series_id FROM a01i_SeriesItems WHERE item_id = $item_id");

    } else {
      $group_item_id = null;

      if ($data->isGroup) {
        $group_item_id = $item_id;
      } else if (!$this->limit) {
        // if this item belongs to a group, find smallest one
        $sql = "SELECT @gid := group_item_id AS group_item_id, (SELECT COUNT(*) FROM a01i_ItemsGroup WHERE group_item_id = @gid) AS contains
                        FROM a01i_ItemsGroup ig
                        LEFT JOIN a01i_Items i ON (i.id = ig.group_item_id)
                        WHERE item_id = $item_id AND is_active
                        ORDER BY contains
                        LIMIT 1";

        $group_item_id = (int)($this->QueryFetch($sql)->group_item_id ?? 0);
      }

      if ($group_item_id) {
        $r = $this->QueryFetch("SELECT code, label AS title FROM a01i_Items WHERE id = $group_item_id");
        $series->id      = -$group_item_id; // ensure no conflict with "real" series ids from database
        $series->item_id = $group_item_id;
        $series->code    = $r->code;
        $series->title   = $r->title;

        // a couple groups (preschool) have subgroups
        $sql = "SELECT ig.item_id, sub_g.item_id AS sub_item_id
                        FROM a01i_ItemsGroup ig
                        LEFT JOIN a01i_ItemsGroup sub_g ON (sub_g.group_item_id = ig.item_id)
                        WHERE ig.group_item_id = $group_item_id
                        ORDER BY ig.sort_order, sub_g.sort_order";
      } else {
        // item is the only one in the "series"
        $sql = "SELECT $item_id AS item_id";
      }

      $res = $this->Query($sql);
    }

    $index = 0;

    while ($r = $res->fetch_object()) {
      $item_id = (int)($r->sub_item_id ?? $r->item_id);
      $series->items[$index] = $this->Data($item_id);
      $series->items[$index]->index = $index;
      $index++;
    }

    return $series;

  } // GetSeries()

  //---------------------------------------------------------------------------------------------

  private function GetSamples($data): array {

    $dir = "$data->type/$data->code";

    $files = glob("$dir/*.*");

    if (!is_array($files)) return [];

    $data->samples = [];

    foreach ($files as $file) {
      $id = $this->ParseFilename($file, ($data->type == 'audio' ? 'audio' : 'image'), $data);

      if ($data->type == 'audio') {
        // find any associated images (sheet music)
        $image_files = glob("$dir/*.$id\(*\).{jpg,gif}", GLOB_BRACE);

        foreach ($image_files as $image_file) {
          $this->ParseFilename($image_file, 'image', $data);
        }
      }
    }

    $data->samples = $this->SortSamples($data->samples);

    return $data->samples;

  } // GetSamples()

  //---------------------------------------------------------------------------------------------

  private function ParseFilename($file, $type, &$data) {

    $samples = &$data->samples;

    $ext = ($type == 'image' ? 'jpg|gif' : 'mp3');

    //                  [1]id        [2]dpi     [3]format
    if (!preg_match("'\.([\w-]+)(?:\((\d+)\))?\.({$ext})$'", $file, $m)) return null;

    list(,$id,$dpi,$ext) = $m;

    $sort = $this->GetSortKeyFromId($id);

    if (!isset($samples[$sort])) {
      $samples[$sort] = (object)[
        'index' => null,
        'id'    => $id,
      ];
    }

    if ($type == 'audio') {
      $samples[$sort]->audio = $file;
    }

    if ($type == 'image') {
      $dpi = +$dpi;

      list($width,$height) = getimagesize($file);

      if (!isset($samples[$sort]->image)) {
        $samples[$sort]->image = (object)[
          'ext' => $ext,
          'w'   => $dpi ? round($width  / $dpi, 4) : $width,
          'h'   => $dpi ? round($height / $dpi, 4) : $height,
        ];
      }

      // if any of the samples has zoom or print sizes, all should have them
      if ($dpi == 120) $data->hasZoom  = true;
      if ($dpi == 200) $data->hasPrint = true;
    }

    return $id;

  } // ParseFilename()

  //---------------------------------------------------------------------------------------------

  private function GetSortKeyFromId($id): string {

    $segs = $this->GetSegsFromId($id);

    $sortKey = '';

    // pad with ascii so that: (alpha) ' ' precedes (numeric) '.' precedes (alpha hyphen) '_'
    // lowercase roman numerals are converted to numbers but retain their alpha sort precedence (used in preface numbering)
    foreach ($segs as $i => $v) {
      $vC = $this->ConvertRomanNumeral($v);
      $hasHyphenAfter = (isset($segs[$i + 1]) && $segs[$i + 1] == '-');
      $sortKey .= str_pad($vC, 4, (is_numeric($v) ? '.' : ($hasHyphenAfter ? '_' : ' ')), STR_PAD_LEFT);
    }

    //if (DEV) echo "\r\n". str_pad($id, 10, ' ') .": $sortKey";

    return $sortKey;

  } // GetSortKeyFromId()

  //---------------------------------------------------------------------------------------------

  private function SortSamples($samples): array {

    ksort($samples, SORT_STRING);

    $samples = array_values($samples);

    $index = 0;

    $sortedSamples = [];

    foreach ($samples as $sample) {
      $sample->index = $index++;

      //if (DEV) echo "\r\n". $sample->index .":". $sample->id;

      if ($sample->index > 0 && !$this->IsSequential($sample, $samples)) {
        $sample->nonsequential = true;
      }

      $sortedSamples[] = $sample;
    }

    return $sortedSamples;

  } // SortSamples()

  //---------------------------------------------------------------------------------------------

  private function IsSequential($sample, $samples): bool {

    $id        = $sample->id;
    $idPrev    = $samples[$sample->index - 1]->id;

    $segs      = $this->GetSegsFromId($id);
    $segsPrev  = $this->GetSegsFromId($idPrev);

    $end       = end($segs);
    $parent    = prev($segs);
    if ($parent === '-') $parent = prev($segs);

    $endPrev   = end($segsPrev);
    if ($endPrev === ID_VERSO) $endPrev = prev($segsPrev);
    $parentPrev = prev($segsPrev);
    if ($parentPrev === '-') $parentPrev = prev($segsPrev);

    $end       = $this->ConvertRomanNumeral($end);
    $endPrev   = $this->ConvertRomanNumeral($endPrev);

    $isNum     = is_numeric($end);
    $isNumPrev = is_numeric($endPrev);

    // sub-sequencing or verso: 5, 5A || A, A1 || 7, 7b; C, Cb
    if (($isNumPrev && $id === "{$idPrev}A") || (!$isNumPrev && $id === "{$idPrev}1") || $id === $idPrev . ID_VERSO) {
      return true;
      // 5, 6 || C, D
    } else if ($parent === $parentPrev) {
      return ($isNum && $isNumPrev && $end == $endPrev + 1) || (!$isNum && !$isNumPrev && ord($end) == ord($endPrev) + 1);
    }

    return false;

  } // IsSequential()

  //---------------------------------------------------------------------------------------------

  private function GetSegsFromId($id) {

    preg_match_all(ID_REGEX, $id, $m);

    return $m[1];

  } // GetSegsFromId()

  //---------------------------------------------------------------------------------------------

  private function ConvertRomanNumeral($string) {

    if (!preg_match(ROMAN_REGEX, $string)) return $string;

    $romans = [
      'm'  => 1000,
      'cm' =>  900,
      'd'  =>  500,
      'cd' =>  400,
      'c'  =>  100,
      'xc' =>   90,
      'l'  =>   50,
      'xl' =>   40,
      'x'  =>   10,
      'ix' =>    9,
      'v'  =>    5,
      'iv' =>    4,
      'i'  =>    1,
    ];

    $result = 0;

    foreach ($romans as $key => $value) {
      while (strpos($string, $key) === 0) {
        $result += $value;
        $string = substr($string, strlen($key));
      }
    }

    return $result;

  } // ConvertRomanNumeral()

  //---------------------------------------------------------------------------------------------

  private function IncludeSampleData($data) {

    $filename = "$data->type/$data->code/$data->code.json";

    if (file_exists($filename)) {
      $json_data = json_decode( file_get_contents($filename) );
    } else {
      $json_data = (object)[];
    }

    foreach($data->samples as $i => $v) {
      if (isset($json_data->index->{$v->id})) {
        $data->samples[$i] = (object)array_merge((array)$data->samples[$i], (array)$json_data->index->{$v->id});
      }
    }

    return $data;

  } // IncludeSampleData()

  //---------------------------------------------------------------------------------------------

  public function ChangeCode() {
    $this->set(func_get_args());

    $old = $this->get('old');
    $new = $this->get('new');
    $key = $this->get('key');

    $output = (object)[
      'old'     => $old,
      'new'     => $new,
      'found'   => [],
      'success' => [],
      'fail'    => [],
    ];

    if ($old) {
      $files = array_merge(
        glob("items/*/$old.*"),
        glob("audio/*/$old.*")
      );

      $output->found = $files;
    }

    if ($new) {
      if ($key === MILESTONE_KEY) {
        // rename files
        if (is_array($files) && count($files)) {
          foreach ($files as $filename) {
            //                    [1]           [2]     [3]    [4]
            preg_match("'^(items|audio)/([^/]+)/([^.]+)(\..+)$'", $filename, $m);
            list(, $type, $item, $code, $sample) = $m;

            $this->ChangeCode_RenameFile("$type/$item/$old{$sample}"
              , "$type/$item/$new{$sample}", $output);
          }
        }
        // rename directory
        if (file_exists("items/$old")) {
          $this->ChangeCode_RenameFile("items/$old", "items/$new", $output);
        }
        if (file_exists("audio/$old")) {
          $this->ChangeCode_RenameFile("audio/$old", "audio/$new", $output);
        }
      } else {
        $output->fail[] = '[ACCESS DENIED]';
      }
    }

    return $this->Success($output);

  } // ChangeCode()

  //---------------------------------------------------------------------------------------------

  private function ChangeCode_RenameFile($file, $new, &$output) {
    if (rename($file,$new)) {
      $output->success[] = $file;
    } else {
      $output->fail[] = $file;
    }
  } // ChangeCode_RenameFile

  //---------------------------------------------------------------------------------------------

} // Samples{}

_Object2::autoinit();
