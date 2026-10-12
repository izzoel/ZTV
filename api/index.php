<?php

// Fix Vercel serverless SCRIPT_NAME so Symfony/Laravel doesn't strip /api prefix from route paths
$_SERVER['SCRIPT_NAME'] = '/index.php';

// Forward Vercel serverless function requests to Laravel's public/index.php
require __DIR__ . '/../public/index.php';

