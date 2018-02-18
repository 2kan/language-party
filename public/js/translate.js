$( document ).ready( function ()
{
	$( "#inputForm" ).on( "submit", function ()
	{
		$( "#translationOutlet" ).html( "" );
		socket.emit( "translate", { text: $( "#input" ).val(), languages: "zu,ar,th,zh-TW,lb,uk,en" } );
		return false;
	} );
} );

socket.on( "translation", function ( a_response )
{
	console.log( a_response );
	var html = "<strong>" + a_response.language + "</strong> - " + a_response.translation + "<br />";
	if ( a_response.equilibrium )
		html = "<span style='color:green'>" + html + "</span>";

	$( "#translationOutlet" ).append( html );
} );

socket.on( "err", function ( a_err )
{
	console.log( a_err );
	$( "#translationOutlet" ).append( "<strong>" + a_err + "</strong>" );
} );