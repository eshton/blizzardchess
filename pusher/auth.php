<?php 
require('Pusher.php');


  $pusher = new Pusher('85bd7d5035de9cd7ceb0', '7d2fa7f8ae7ce18cf266', '279763');
  echo $pusher->socket_auth($_POST['channel_name'], $_POST['socket_id']);
