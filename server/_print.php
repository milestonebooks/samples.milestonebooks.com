<?php

///////////////////////////////////////////////////////////////////////////////////////////////////

// get current directory
define('THIS_DIR',getcwd());

//switch to admin subdomain...
$dir = "/var/www/vhosts/milestonebooks.com/subdomains/admin/httpdocs/";
chdir($dir);

// bootstrap
$dir = preg_replace("'(httpdocs).*$'", "$1", getcwd()) . '/x/libs/classes/';
require_once($dir . '_Object.php');

/* CLASS PrintSample *****************************************************************************/
class PrintSample extends _Object {
	
    var $HTML = '';
    var $pages = array();
    var $file = '';
    var $dev = '';
    
    //--------------------------------------------------------------------------------------------------------------------------------
    
    function __construct($item,$page) {
        parent::__construct();
        
        chdir(THIS_DIR);

        $this->dev = isset($_COOKIE['dev']) ? '.dev' : '';
    	
        $this->item = $item;
        $this->page = $page;
        
        $this->GetItemTitle();
        
        $this->GetPages();
        
        $this->HTML_Head();
        $this->HTML_Page();
        $this->HTML_Close();
        
        $this->OutputHTML();
    	
    } // __construct()
    
    //--------------------------------------------------------------------------------------------------------------------------------
        
    private function GetItemTitle() {
    	
        $sql = "SELECT label FROM a01i_Items WHERE code = '$this->item'";
        $r = $this->QueryFetch($sql);	
        if (!$r) $this->FatalError("Item $this->item not found.");
        $this->itemTitle = ($r ? $r->label : '');
        
    } // GetItemTitle()
    
    //--------------------------------------------------------------------------------------------------------------------------------
    
    private function GetPages() {
    	 
        // load array of image files from item directory
        
        $dir = "items/$this->item/$this->item.$this->page";
         
        foreach (glob("$dir(*).*") as $filename) {
        	// [1]page number|letter sequence [2]dpi [3]image format
        	preg_match("'\.(\d+|\w+)(?:\((\d+)\))?\.(jpg|gif)$'",$filename,$fm);
            $image_size = getimagesize($filename);
            $this->pages[$fm[2]] = array(
                'filename' => $filename,
                'dpi' => $fm[2],
                'format' => $fm[3],
                'width' => $image_size[0],
                'height' => $image_size[1]
            );
        }
        ksort($this->pages);
        
        if (!count($this->pages)) { $this->FatalError("Item $this->item has no samples."); }
        
        $page = array_pop($this->pages);
        $this->file = $page['filename'];

    } // GetPages()
    
    //--------------------------------------------------------------------------------------------------------------------------------
    
    private function HTML_Head() {
    	
        $this->HTML = "
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <title>Printing... page {$this->page} of {$this->itemTitle}</title>
                    <link rel='stylesheet' href='../_css/reset-fonts-grids.css'>
                    <link rel='stylesheet' href='../_css/print{$this->dev}.css' media='all'>
                    <script src='https://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js'></script>
                    <script src='../_js/print{$this->dev}.js'></script>
                    <script>
                        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
                        ga('create','UA-738358-1','milestonebooks.com');ga('send','pageview');
                    </script>
                </head>
                <body>";
                    
    }
    
    //--------------------------------------------------------------------------------------------------------------------------------
    
    private function HTML_Page() {
    	
        $this->HTML .= "<p id='copyright'><span>Copyrighted Material. Use for evaluation purposes only. Print-out may not be actual size.</span></p>" .
                "<img src='$this->file' />";

    }
    
    //--------------------------------------------------------------------------------------------------------------------------------
    
    private function HTML_Close() {
    	
        $this->HTML .= "</body></html>";
        
    }
    
    //--------------------------------------------------------------------------------------------------------------------------------
    
    private function OutputHTML() {
    	
        echo $this->HTML;
        
    }
    
    //--------------------------------------------------------------------------------------------------------------------------------
    
    function FatalError($message) {
    	
        $this->HTML_Head();
        
        $this->HTML .= "<table id='error'><tr><td>" .
                "Error: $message" .
                "</td></tr></table>";
        
        $this->HTML_Close();
        $this->OutputHTML();
        exit;
        
    }
    
    //--------------------------------------------------------------------------------------------------------------------------------
    
} // PrintSample{}

/*************************************************************************************************/

if (!isset($_GET['file'])) exit;

preg_match("'^([^./]+)\.(\w+)'",$_GET['file'],$fm);

if(!$fm) exit;

if(($item = $fm[1]) && ($page = $fm[2])) {
    new PrintSample($item,$page);
}
