$.getJSON('lang.json', function (json) {

	if(!localStorage.getItem('lang')) {
		localStorage.setItem('lang', 'en');
	}

	let def = localStorage.getItem("lang");
	$(".tr").each(function (index, value) {
		if($(this).hasClass('text')) {
			$(this).text(json[def][$(this).attr('key')]);
		} else {
			$(this).html(json[def][$(this).attr('key')]);
		}
	});

	$(".lang").click(function () {
		let lang = $(this).attr('id');
		if(!localStorage.getItem('lang') != lang) {
			localStorage.setItem('lang', lang);
			$(".lang").each(function (index, value) {
				$(this).html(json[lang][$(this).attr('key')]);
			});
		}
	});
});