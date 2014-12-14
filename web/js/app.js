//Declare Variables

var apiKey,
	sessionId,
	token,
	response,
	session,
	publisher;


//get the APIKEY and TOKEN 
$(document).ready(function(){

			getApiAndToken();
			
		});


function getApiAndToken()
{
	$.get("/session",function(res){

			apiKey = res.apiKey;
            sessionId = res.sessionId;
            token = res.token;

            initializeSession(); 

	});

}


                
function initializeSession()
{
			//Initialize Session Object
            session = OT.initSession(apiKey, sessionId);


            //Subscribe to a stream created
            session.on("streamCreated",function(event){
        			$("#subscriber").append("<div id='subscriber_div'></div>");                              	       
					session.subscribe(event.stream,"subscriber_div",{width:"100%",height:"100%"});
            });  


            //Connect to the Session
            session.connect(token, function(error)
            {

            		//If the connection is successful, initialize a publisher and publish to the session
            		if(!error)
            		{
            			$("#publisher").append("<div id='publisher_div'></div>");
                        publisher = OT.initPublisher("publisher_div",{width:"100%",height:"100%"});

                        session.publish(publisher);
                        
            		}

            });                  

}                  		

