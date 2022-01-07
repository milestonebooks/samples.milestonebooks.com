<?php
// updated: 2019-05-01
///////////////////////////////////////////////////////////////////////////////////////////////////

define('DEV', isset($_GET['dev']) || isset($_COOKIE['dev']));

if (isset($_GET['dev'])) setcookie('dev',($_GET['dev'] == 'true' ? '1' : false),0,'/');

$_dev = (DEV ? '.dev' : '');

require("Samples{$_dev}.php");
new Samples(/*autorun*/true);
exit;

if (isset($_COOKIE['dev']) && !substr_count(__FILE__, '_index.dev.php')) {
    require_once('_index.dev.php');
    exit;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// [2018-10-12] toggle for site version
// [2019-05-01] default to new version
$use_old_ver = false;

if (isset($_COOKIE['ver'])) {
    $use_old_ver = ($_COOKIE['ver'] == 'old');
}
if (isset($_GET['ver'])) {
    $use_old_ver = ($_GET['ver'] == 'old');
    setcookie('ver',($use_old_ver ? 'old' : 'new'),time()+60*60*24*30/*days*/,'/');
}

// action=Data only works in new version
if (isset($_GET['action']) && $_GET['action'] == 'Data') $use_old_ver = false;

// checks if requested item is an audio type (audio only works in new version)
$item = strtoupper( trim( preg_replace("'/[^/]*$'", '', $_SERVER['REQUEST_URI']), '/') );
if (file_exists("audio/$item")) $use_old_ver = false;

if (!$use_old_ver) {
    require("Samples{$_dev}.php");
    new Samples(/*autorun*/true);
    exit;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// 2018-10-12 deprecated; can be removed when option to use old version is retired

// get current directory
define('THIS_DIR',getcwd());

//switch to admin subdomain...
$dir = "/var/www/vhosts/milestonebooks.com/subdomains/admin/httpdocs/";
chdir($dir);

// bootstrap
$dir = preg_replace("'(httpdocs).*$'", "$1", getcwd()) . '/x/libs/classes/';
require_once($dir . '_Object.php');

/* CLASS Sample **********************************************************************************/
class Sample extends _Object {

    var $HTML    = '';
    var $pages   = array();
    var $series  = array('referer'=>null,'prev'=>null,'next'=>null);
    var $dev     = false;
    var $version = '2019-02-01'; // .css and .js files must match
    var $output  = 'html';

    var
        // page sequence strings may have alternating letter and/or number groups; letters are assumed to have precedence
        // e.g. (A) < (1); (14) < (14b); (T2) < (T19)
        // uppercase vs lowercase is ignored, and need not be mixed (no use case yet known); ascii uppercase precedes lowercase
        $idRegex = "'(\d+|[[:alpha:]]+)'",

        // page sequences for prefaces that use roman numerals should always be lower case; UPPERCASE is reserved for unnumbered samples
        $romanRegex = "'^[ivxlcdm]+$'";

    function __construct($item) {
        parent::__construct();

        chdir(THIS_DIR);

        if ($_REQUEST['output'] == 'json') $this->output = 'json';

        $this->dev = isset($_COOKIE['dev']);

        if ($this->dev) $this->version = 'dev';

        $this->item = $item;

        $this->GetItemTitle();

        if ( !$this->GetPages($this->item) ) {
            // if unable to find item number, remove vendor prefix and try again
            preg_match("/^[^\-]+\-(.+)$/",$this->item, $m);

            if ($this->GetPages($m[1])) {
                $this->item = $m[1];
            } else {
                $this->FatalError("Item $this->item has no samples.");
            }
        }

        $this->series['referer'] = $_SERVER["HTTP_REFERER"];
        $this->GetSeries($this->item);

        $this->HTML_Head();
        $this->HTML_Controls();
        $this->HTML_Pages();
        $this->HTML_Close();

        $this->OutputHTML();

    } // __construct()

    ///////////////////////////////////////////////////////////////////////////////////////////////

    function GetItemTitle() {

        $sql = "SELECT label FROM a01i_Items WHERE code = '$this->item'";
        $r = $this->QueryFetch($sql);
        if(!$r) { $this->FatalError("Item $this->item not found."); }
        $this->itemTitle = ($r ? $r->label : '');

    } // GetItemTitle()

    ///////////////////////////////////////////////////////////////////////////////////////////////

    function GetPages($item) {

        // load array of image files (jpg or gif) from item directory

        $dir = "items/$item";

        $files = glob("$dir/*.*");

        if (!is_array($files)) {
            return false;
        }

        foreach ($files as $filename) {
            // [1]page number|letter sequence [2]dpi [3]image format
            //             [1]           [2]        [3]
            preg_match("'\.(\d+|\w+)(?:\((\d+)\))?\.(jpg|gif)$'",$filename,$fm);
            if (!$fm[1]) continue;
            $image_size = getimagesize($filename);
            $id     = $fm[1];
            $dpi    = $fm[2];
            $format = $fm[3];

            $sort = $this->GetSortKeyFromId($id);

            // page sequence strings may have alternating letter and/or number groups; letters are assumed to have precedence
            // e.g. (A) < (1); (14) < (14b); (T2) < (T19)
            // uppercase vs lowercase is ignored, and need not be mixed (no use case yet known); ascii uppercase precedes lowercase
            // reformat the page sequence string to be used by sort functions (based on ascii order)
            preg_match_all("'(\d+|[[:alpha:]]+)'",$sort,$im);

            foreach ($im[1] as $k => $v) {
                $sort = str_replace($v, str_pad($v, 4, (is_numeric($v) ? '.' : ' '), STR_PAD_LEFT), $sort);
            }

            if (!isset($this->pages[$sort])) {
                $this->pages[$sort] = (object)array(
                    'id'     => $id,
                    'format' => $format,
                    'width'  => ($image_size[0] / $dpi),
                    'height' => ($image_size[1] / $dpi),
                    'dpi'    => array($dpi)
                );
            } else {
                $this->pages[$sort]->dpi[] = $dpi;
            }
        } // files loop

        ksort($this->pages);

        //echo "<!-- ". print_r($this->pages,true) ." -->";

        foreach ($this->pages as $page) {
            sort($page->dpi);
        }

        if (!count($this->pages)) {
            return false;
        }

        return $item;

    } // GetPages()

    //---------------------------------------------------------------------------------------------

    private function GetSortKeyFromId($id) {

        preg_match_all($this->idRegex, $id, $m);

        $sortKey = $id;

        // pads each segment with ' ' (for alpha) or '.' (for digit); ascii ' ' precedes '.'
        // lowercase roman numerals are converted to numbers but retain their alpha sort precedence (used in preface numbering)
        foreach ($m[1] as $v) {
            $vC = $this->ConvertRomanNumeral($v);
            $sortKey = str_replace($v, str_pad($vC, 4, (is_numeric($v) ? '.' : ' '), STR_PAD_LEFT), $sortKey);
        }

        return $sortKey;

    } // GetSortKeyFromId()

    //---------------------------------------------------------------------------------------------

    private function ConvertRomanNumeral($string) {

        if (!preg_match($this->romanRegex, $string)) return $string;

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

    ///////////////////////////////////////////////////////////////////////////////////////////////

    function GetSeries($item) {

        // load array of image files (jpg or gif) from item directory

        $dir = "items/$item";

        $files = glob("$dir/*.series");

        if (!is_array($files)) {
            return false;
        }

        foreach ($files as $filename) {
            if ( preg_match("'\/([^/]+).prev.series$'",$filename,$fm) ) {
                $this->series['prev'] = $this->GetItemObject($fm[1]);
            }
            if ( preg_match("'\/([^/]+).next.series$'",$filename,$fm) ) {
                $this->series['next'] = $this->GetItemObject($fm[1]);
            }
        }

    } // GetSeries()

    ///////////////////////////////////////////////////////////////////////////////////////////////

    function GetItemObject($item) {
        $sql = "SELECT i.label, CONCAT('img/',img.path) AS src
                FROM a01i_Items AS i
                LEFT JOIN xcart.xc_product_images img ON (img.product_id = i.id)
                WHERE i.code = '$item'";
        $r = $this->QueryFetch($sql);
        if (!$r) return null;

        $image_size = getimagesize('https://www.milestonebooks.com/'. $r->src);

        return (object)array(
            'item' => $item,
            'src'  => $r->src,
            'w'    => $image_size[0],
            'h'    => $image_size[1],
            'label'=> $r->label
        );
    } // GetItemObject()

    ///////////////////////////////////////////////////////////////////////////////////////////////

    function HTML_Head() {

        $this->HTML = <<<HTML
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Samples &gt; Item $this->item: $this->itemTitle</title>
                    <link rel="stylesheet" href="../_css/reset-fonts-grids.css">
                    <link rel="stylesheet" href="../_css/samples.{$this->version}.css" media="all">
                    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
                    <script src="../_js/samples.{$this->version}.js"></script>
                    <script>
                        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
                        ga('create','UA-738358-1','milestonebooks.com');ga('send','pageview');
                    </script>
                </head>
                <body>
HTML;

    } // HTML_Head()

    ///////////////////////////////////////////////////////////////////////////////////////////////

    function HTML_Controls() {

        $title_safe_quote = str_replace("'",'&rsquo;',$this->itemTitle);

        $this->HTML .= "<div id='panel-controls'>" .
                "<p title='$title_safe_quote'>$this->itemTitle</p>" .
                "<div id='toolbar'>" .
                "<p id='tool-position'>Sample <span class='page-turn prev disabled' title='Previous Sample...'>&lsaquo;</span><input id='current-position' value='' /><span class='page-turn next disabled' title='Next Sample...'>&rsaquo;</span> of <span id='samples-total'>1</span></p>" .
                "<div id='tool-printer' title='Print [Unavailable]'></div>" .
                "<div id='tool-zoom-out' title='Zoom Out [Unavailable]'></div>" .
                "<div id='tool-zoom-in' title='Zoom In [Unavailable]'></div>" .
                "<div id='tool-ruler' title='Show Ruler'></div>" .
                "<div id='close' title='Close Samples'></div>" .
                "</div>" .
                "</div>";

    } // HTML_Controls()

    ///////////////////////////////////////////////////////////////////////////////////////////////

    function HTML_Pages() {

        $sample_position = 0;

        $pages_js = "<script type='text/javascript'>pages=[";
        $this->HTML .= "<div id='panel-viewer' class='viewer' item='$this->item'>" .
                "<table id='viewer-tray' border='0' cellspacing='0' cellpadding='0' summary=''><tr>" .
                "<td class='page-turn prev disabled' title='Previous Sample...'><div class='cell-liner'>" .
                "<div id='series-prev' class='series-turn prev disabled'><p class='button'><span class='arrow'>&lsaquo;</span>&nbsp;<span class='text'>PREV ITEM</span>&nbsp;&nbsp;<span class='arrow'>&lsaquo;</span></p><img src='' /><p class='label'></p></div>" .
                "<table border='0' cellspacing='0' cellpadding='0' summary=''><tr><td><span class='arrow'>&lsaquo;</span></td></tr><tr><td>PREV</td></tr><tr><td><span class='arrow'>&lsaquo;</span></td></tr></table>" .
                "</div></td><td id='img-pane'>";

        $sample_position = 0;

        foreach ($this->pages as $sort => $page) {

            $sample_position++;
            $page_sequence = $page->id;

            $pages_js     .= ($sample_position > 1 ? ',' : '') . "{position:$sample_position,sequence:'$page_sequence',";
            $this->HTML   .= "<div id='p-$sample_position' sample-position='".$sample_position."' page-sequence='$page_sequence'>";
            $pages_js_dpi  = '';
            $pages_js_size = '';

            foreach ($page->dpi as $dpi) {

                $img_class = 'img';
                $zoom_to   = '';
                if (count($page->dpi) > 1) {
                    if ($dpi == $page->dpi[0]) { // if at smallest size, enable zoom in to next size
                        $img_class .= ' zoom-in';
                        $zoom_to    = "zoom-to='{$page->dpi[1]}'";
                    } else if ($dpi == $page->dpi[1]) { // enable zoom out to smallest size
                        $img_class .= ' zoom-out';
                        $zoom_to    = "zoom-to='{$page->dpi[0]}'";
                    }
                }

                $width_pixels  = $page->width  * $dpi;
                $height_pixels = $page->height * $dpi;

                $pages_js_dpi .= ($pages_js_dpi ? ',' : '') ."'$dpi'";
                $pages_js_size = "w:{$page->width},h:{$page->height}";
                $this->HTML   .= "<img class='$img_class' id='p-$sample_position-$dpi' page-dpi='$dpi' $zoom_to page-format='{$page->format}' page-width='{$width_pixels}' page-height='{$height_pixels}' style='width:{$width_pixels}px; height:{$height_pixels}px;' src=''>";

            }

            $pages_js   .= "dpi:[$pages_js_dpi],$pages_js_size}";
            $this->HTML .= "</div>";

        }

        $pages_js .= "];</script>";

        $series_js = "<script type='text/javascript'>series=". json_encode($this->series) .";</script>";

        $this->HTML .= "" .
                "<div id='copyright'><span id='message'>ENABLE JAVASCRIPT TO VIEW SAMPLES</span></div>" .
                "</td><td class='page-turn next disabled' title='Next Sample...'><div class='cell-liner'>" .
                "<table border='0' cellspacing='0' cellpadding='0' summary=''><tr><td><span class='arrow'>&rsaquo;</span></td></tr><tr><td>NEXT</td></tr><tr><td><span class='arrow'>&rsaquo;</span></td></tr></table>" .
                "<div id='series-next' class='series-turn next disabled'><p class='button'><span class='arrow'>&rsaquo;</span>&nbsp;&nbsp;<span class='text'>NEXT ITEM</span>&nbsp;<span class='arrow'>&rsaquo;</span></p><img src='' /><p class='label'></p></div>" .
                "</div></td>" .
                "</tr></table>" .
                "</div>" .

                "<div id='rulers'>" .
                "<div id='ruler-U' class='ruler'></div>" .
                "<div id='ruler-R' class='ruler'></div>" .
                "<div id='ruler-D' class='ruler'></div>" .
                "<div id='ruler-L' class='ruler'></div>" .
                "</div>" .

                $pages_js .
                $series_js;

    } // HTML_Pages()

    ///////////////////////////////////////////////////////////////////////////////////////////////

    function HTML_Close() {

        $this->HTML .= <<<HTML
                <!-- BEGIN LivePerson Monitor. --><script type="text/javascript">var lpMTagConfig = {'lpServer' : 'server.iad.liveperson.net','lpNumber' : '3684610','lpProtocol' : 'https'}; function lpAddMonitorTag(src){if(typeof(src)=='undefined'||typeof(src)=='object'){src=lpMTagConfig.lpMTagSrc?lpMTagConfig.lpMTagSrc:'/hcp/html/mTag.js';}if(src.indexOf('http')!=0){src=lpMTagConfig.lpProtocol+'://'+lpMTagConfig.lpServer+src+'?site='+lpMTagConfig.lpNumber;}else{if(src.indexOf('site=')<0){if(src.indexOf('?')<0)src=src+'?';else src=src+'&';src=src+'site='+lpMTagConfig.lpNumber;}};var s=document.createElement('script');s.setAttribute('type','text/javascript');s.setAttribute('charset','iso-8859-1');s.setAttribute('src',src);document.getElementsByTagName('head').item(0).appendChild(s);} if (window.attachEvent) window.attachEvent('onload',lpAddMonitorTag); else window.addEventListener('load',lpAddMonitorTag,false);</script><!-- END LivePerson Monitor. -->

                </body></html>
HTML;

    } // HTML_Close()

    ///////////////////////////////////////////////////////////////////////////////////////////////

    function OutputHTML() {

        echo $this->HTML;

    } // OutputHTML()

    ///////////////////////////////////////////////////////////////////////////////////////////////

    function FatalError($message) {

        if ($this->output == 'json') {
            $this->Failure($message);
            exit;
        }

        $this->HTML_Head();

        $this->HTML .= "<table id='error'><tr><td>" .
                "Error: $message" .
                "</td></tr></table>";

        $this->HTML_Close();
        $this->OutputHTML();
        exit;

    } // FatalError()

    ///////////////////////////////////////////////////////////////////////////////////////////////
} // Sample{}

/*************************************************************************************************/

preg_match("'^/([^/]+)(/)?'",$_SERVER['REQUEST_URI'],$sm);

// force trailing slash
if (!$sm[2]) {
    header("Location:".$_SERVER['HOST'].$_SERVER['REQUEST_URI'].'/');
    exit;
}

if ($item = $sm[1]) {
    $Sample = new Sample($item);
}
