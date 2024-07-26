use std::fs;
use std::path::PathBuf;
use rocket::serde::{Serialize, Deserialize};
extern crate image_base64;

fn is_image(file: &PathBuf) -> bool{
    let file_extension = match file.extension(){
        Some(file_extension) => file_extension.to_str().unwrap(),
        _ => return false
    };
    let image_extensions = vec!["png", "jpg", "jpeg", "gif", "bmp", "webp"];
    image_extensions.contains(&file_extension)
}
use std::fs::File;
use std::io::prelude::*;
use base64::encode;
fn get_image_base64(file_path_buffer: &PathBuf) -> Option<String>{
    println!("Converting to base64: {:?}", file_path_buffer);
    // Open the image file
    let mut file = File::open(file_path_buffer).expect("Failed to open image file");

    // Read the file content into a byte vector
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).expect("Failed to read image file");

    // Encode the byte vector to Base64
    let encoded = encode(&buffer);
    // println!("Encoded: {}", encoded);
    Some(encoded)
}

pub fn get_directory_contents(directory_location: PathBuf) -> Vec<DirectoryItem>{
    println!("Directory: {:?}", directory_location);

    // If directory_location is empty, return "/"
    let directory_location = match directory_location.to_str().unwrap() {
        "" => PathBuf::from("/"),
        _ => directory_location
    };
    
    // Second, get the contents of the current directory
    let contents = fs::read_dir(directory_location).unwrap();

    // Add all the contents to a vector of strings
    let mut contents_vec: Vec<DirectoryItem> = Vec::new();

    for content in contents {
        let content = content.unwrap();
        let content_type = content.file_type().unwrap();
        let file_type = match content_type.is_dir() {
            true => DirectoryItemType::Directory,
            _ => DirectoryItemType::File
        };

        let file_is_image = match file_type {
            DirectoryItemType::File => is_image(&content.path()),
            _ => false
        };

        let thumbnail = match file_is_image {
            true => get_image_base64(&content.path()),
            _ => None
        };

        let content_item = DirectoryItem{
            location: content.path(),
            r#type: file_type,
            thumbnail: thumbnail,
        };
        contents_vec.push(content_item);
    }

    contents_vec
}

pub fn launch_application(path: String){
    // Attempt to launch the application using the os default application for that filetype
    let path = PathBuf::from(path);

    let result = opener::open(&path);

    println!("Result: {:?}", result);
    
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct Directory{
    pub location: PathBuf,
    pub contents: Vec<DirectoryItem>
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct DirectoryItem{
    pub location: PathBuf,
    pub r#type: DirectoryItemType,
    pub thumbnail: Option<String>
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub enum DirectoryItemType{
    File,
    Directory
}

impl Directory{
    pub fn new(location: PathBuf) -> Directory{
        let contents = get_directory_contents(location.clone());
        Directory{
            location,
            contents
        }
    }
}