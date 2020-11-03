<?php
/**
 * Add a new user into the database
 * POST REQUEST
 */

// required headers
header("Access-Control-Allow-Origin: *");
session_start();

// required clases
include_once '../objects/User.php';
include_once '../config/database.php';

$url = $_SERVER['HTTP_REFERER'];


// assume all fields are sent
// no verification required
if (isset($_POST['user'])) {
    
    // INSERT INTO DATABASE
    $database = new Database();
    $db = $database->getConnection();
    $user = new User($db);
    $new_user = json_decode($_POST['user'], true);

    $email = $new_user['email'];
    $password = password_hash($new_user["password"], PASSWORD_DEFAULT); // Create a password hash
    $name = $new_user['name'];

    $user->setUserDetails($email, $name, $password);

    if ($user->saveUser()) {
        $response_array = array();

        $response_array['user'] = $user->getUserInformation();
        $response_array['filter'] = $user->getUserFilterSettings();
        $response_array['locations'] = $user->getFavouriteLocations();

        $_SESSION["user"] = $response_array;
    } else {
        http_response_code(500);
        echo "An error has occured";
    }
}
?>
