
# ATS Assessment

## A Note About The Assessment's Instructions

As taken from the file attached to the email presenting the assessment:

- Goals	
	- create a git repo
	- connect to server and recieve real-time data
	- store data in table structure provided
	- provide detailed search at //localhost/details
	- provide summary report search daily CDR counts by customer at //localhost/summary?cust_id=X
	- provide activity log at //locahost/logs

The three endpoints do not provide sufficient details to explain what data should be returned, and how, and in some cases what data should be included in the request, and how. Details about each endpoint are below. In all cases, the application returns JSON data. 

### //localhost/details

This endpoint expects a POST request with a JSON body of search fields, in the following format:

{
    "id": "",
    "cust_id": "",
    "caller_id": ""
}

It returns a JSON array of objects, where each object is a full cdr matching the search criteria. The search fields are all AND'ed together, allowing for a narrowing or widening of the results.

### //localhost/summary?cust_id=X

This returns an array. The array contains objects including the date and number of cdrs for the date, for the cust_id provided in the URL.

### //locahost/logs

This returns an array containing objects for each date that cdrs exist. Aside from the date, the objects also contain an array of objects that includes the cust_id and the total calls for that customer on that date. 

## Configuration

The app's main file is *index.js*. It can be run with the *npm start* command.

The app listens on port 3100, although you can change the *port* variable in *index.js*.

Two files, *mysql-creds.json* and *api-creds.json* are **not** included. They need to be created if you intend to run the code. They reside in the project's main directory. I could have used environment files, but for this example it is easier to use JSON since it does not require a separate package.

## Running The Code

Run *npm start*.

The application attempts to create the database table and configure it, according to the provided instructions, if it does not already exist. The app is configured with the database named *ats*.

The *fetchRecords.js* file makes the authentication request, opens the connection to the API, and stores the cdr records in the database. This file needs to be run separately via *node fetchRecords.js*. This allows the stream to be terminated without stopping the application server.

As noted in the *"A Note About The Assessment's Instructions"* section, the app returns JSON, so you will need to use Postman or some other such application if you want to visualize the results.