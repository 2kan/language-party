const express = require( "express" );
const app = express();
const request = require( "request" );

var bodyParser = require( "body-parser" );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );

const gapi = require( "./google-api.json" );

const TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";

const languages = [ "vi", "en" ];

app.post( "/", function ( a_req, a_res )
{
	console.log( "." );
	if ( a_req.body[ "text" ] == undefined )
	{
		a_res.send( "no input" );
		return;
	}

	var thisTranslation = undefined;
	var lastEnglish = undefined;
	var translations = [];
	var langIndex = 0;

	translate( 0, a_req.body[ "text" ], [], a_res );
} );

function translate( a_langIndex, a_textToTranslate, a_translations, a_httpResponse )
{
	if ( a_translations.includes( a_textToTranslate ) )
	{
		//console.log( a_translations );
		a_httpResponse.send( a_textToTranslate );
		console.log( "Equilibrium: " + a_textToTranslate );
		console.log( "~ done ~" );
		return;
	}

	console.log( "Translating: " + a_textToTranslate );

	request.post( {
		url: TRANSLATE_URL,
		form: {
			q: a_textToTranslate,
			target: languages[ a_langIndex % languages.length ],
			format: "text",
			source: languages[ a_langIndex - 1 % languages.length ],
			model: "base",
			key: gapi.api_key
		}
	}, function ( a_err, a_response, a_body )
		{
			if ( a_err )
			{
				a_httpResponse.status( 500 ).send( "Google done and dun goofed :/" )( a_err );
				return;
			}

			const body = JSON.parse( a_body );

			if ( body == undefined || body.data == undefined || body.data.translations == undefined )
			{
				a_httpResponse.status( 500 ).send( "Something did gone and dun goofed :/" );
				return;
			}

			//console.log( body.data.translations[ 0 ].translatedText );

			if ( a_langIndex % languages.length == 0 )
			{
				a_translations.push( a_textToTranslate );
				//console.log( "added " + a_textToTranslate + " to translated array." );
			}

			translate( a_langIndex + 1, body.data.translations[ 0 ].translatedText, a_translations, a_httpResponse );
		}
	);
}

app.listen( 3000, function ()
{
	console.log( "Listning on 3000" );
} );

