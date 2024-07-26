// This is a rust app that acts as a file searching tool
mod filesystem;

// We need to add cors and allow all origins
use rocket::http::{Header, Method};
use rocket::{Request, Response};
use rocket::fairing::{Fairing, Info, Kind};

// Cors set http ok status

pub struct CORS;

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "CORS Fairing",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        // Check if the request is an OPTIONS preflight request
        if request.method() == Method::Options {
            response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
            response.set_header(Header::new("Access-Control-Allow-Methods", "POST, GET, PATCH, OPTIONS"));
            response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
            response.set_status(rocket::http::Status::NoContent);
        } else {
            // Set CORS headers for non-preflight requests
            response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        }
    }
}

#[macro_use] extern crate rocket;
#[post("/", data = "<dir>")]
fn hello(dir: String) -> String {
    // If dir is empty, return the current directory
    let dir_path = match dir.as_str() {
        "" => std::env::current_dir().unwrap(),
        _ => {
            // If the dir path ends with "../", remove it as well as the previous directory
            let fixed_dir = match dir.ends_with("../"){
                true => {
                    let dir_clone = dir.clone();
                    let mut dir_split = dir_clone.split("/").collect::<Vec<&str>>();
                    dir_split.pop();
                    dir_split.pop();
                    dir_split.pop();
                    dir_split.join("/")
                },
                _ => dir
            };
            
            std::path::PathBuf::from(fixed_dir)
        }
    };


    let current_dir = filesystem::Directory::new(dir_path);

    // Json stringify current_dir
    let json = serde_json::to_string(&current_dir).unwrap();

    format!("{}", json)
}

#[post("/launch", data = "<filelocation>")]
fn launch(filelocation: String) -> String {
    filesystem::launch_application(filelocation);

    "Success".to_string()
}

#[launch]
fn rocket() -> _ {
    rocket::build().attach(CORS)
    .mount("/", routes![hello])
    .mount("/", routes![launch])
}