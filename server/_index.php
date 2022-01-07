<?php
// updated: 2022-01-07
///////////////////////////////////////////////////////////////////////////////////////////////////

if (isset($_GET['dev'])) setcookie('dev',($_GET['dev'] == 'true' ? '1' : false),0,'/');

define('DEV', isset($_COOKIE['dev']));

$_dev = (DEV ? '.dev' : '');

require("Samples{$_dev}.php");
new Samples(/*autorun*/true);
