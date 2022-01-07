<?php

$output = (object)array(
    'found'   => array(),
    'success' => array(),
    'fail'    => array(),
);

$debug = isset($_REQUEST['debug']);

function rename_file($file, $new, &$output) {
    if (rename($file,$new)) {
        $output->success[] = $file;
    } else {
        $output->fail[] = $file;
    }
} // rename_file()

if (($old = $_REQUEST['old'])) {
    
    $files = array_merge(
        glob("items/*/$old.*"),
        glob("audio/*/$old.*")
    );
    
    $output->found = $files;
}

if (($new = $_REQUEST['new'])) {

	if (is_array($files) && count($files)) {
	    foreach ($files as $filename) {
	        //            [1]           [2]     [3]    [4]
	        preg_match("'^(items|audio)/([^/]+)/([^.]+)(\..+)$'", $filename, $m);
            $type   = $m[1];
            $item   = $m[2];
            $code   = $m[3];
            $sample = $m[4];
            
            rename_file("$type/$item/$old{$sample}"
                       ,"$type/$item/$new{$sample}", $output);
	    }
	}
    if (file_exists("items/$old")) {
        rename_file("items/$old", "items/$new", $output);
    }
    if (file_exists("audio/$old")) {
        rename_file("audio/$old", "audio/$new", $output);
    }

}

header("Content-type: application/json;");
echo json_encode($output);

