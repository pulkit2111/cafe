const express = require("express");
const bodyParser=require("body-parser");
const request = require("request");
const https=require("https");

const app=express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function(req, res){
    res.sendFile(__dirname+"/login.html");
});

app.post("/", function(req,res){
    const firstName=req.body.fName;
    const lastName=req.body.lName;
    const phone=req.body.phone;
    const email=req.body.email;

    const data={
        members:[
            {
                email_address : email,
                status : "subscribed",
                merge_fields:{
                    FNAME: firstName,
                    LNAME: lastName,
                    PHONE: phone
                }

            }
        ]
    };

    const jsonData = JSON.stringify(data);

    const url = "https://us17.api.mailchimp.com/3.0/lists/c931f3b1fb";

    const options= {
        method: "POST",
        auth: "pulkit2111: f6815f411cc3fd7e54e3ff6dd466890e-us17"
    }

    const request = https.request(url, options, function(response){
        if(response.statusCode === 200)
        {
            res.sendFile(__dirname + "/login-success.html");
        }
        else{
            res.sendFile(__dirname + "/login-failure.html");
        }
        response.on("data", function(data){
            console.log(JSON.parse(data));
        });

    });

    request.write(jsonData);
    request.end();

});

// to redirect user to login page if he sucks!
app.post("/failure", function(req, res){
    res.redirect("/");
})

app.listen(process.env.PORT || 3000);



// mailchimp api Key:
// f6815f411cc3fd7e54e3ff6dd466890e-us17

//audience id
// c931f3b1fb