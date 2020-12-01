$(document).ready(function () {
	AOS.init();

	let pathname = window.location.pathname, pages = ["/", "/contact", "/admin"]
	pages.find(function (el, idx, arr) {
		if (el == pathname || (pathname != arr[0] && pathname != arr[1])) {
			$('.nav-item.active').removeClass("active");
			$('.nav-item:nth-child(' + (idx + 1) + ')').addClass('active');
			return;
		}
	});


	$(".custom-select.lang").change(function () {
		let lang = $(this).val();
	});

	/*$.getJSON('js/lang.json', function (json) {

		if(!localStorage.getItem('lang')) {
			localStorage.setItem('lang', 'en');
		}

		let def = localStorage.getItem("lang");
		$(".lang").val(def);

		$(".tr").each(function (index, value) {
			$(this).html(json[def][$(this).attr('key')]);
		});

		$(".lang").change(function () {
			let lang = $(this).val();
			if(!localStorage.getItem('lang') != lang) {
				localStorage.setItem('lang', lang);
				$(".tr").each(function (index, value) {
					$(this).html(json[lang][$(this).attr('key')]);
				});
			}
		});
	});*/
});

function goToContact() { location.href = "/contact" } 

function openLoading(html) {

	let sweet_loader = '<div class="sweet_loader"><svg viewBox="0 0 140 140" width="140" height="140"><g class="outline"><path d="m 70 28 a 1 1 0 0 0 0 84 a 1 1 0 0 0 0 -84" stroke="rgba(0,0,0,0.1)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></g><g class="circle"><path d="m 70 28 a 1 1 0 0 0 0 84 a 1 1 0 0 0 0 -84" stroke="#71BBFF" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dashoffset="200" stroke-dasharray="300"></path></g></svg></div>';
	
	swal.fire({
		html: html,
		showConfirmButton:false,
		onRender: function() {
			$('.swal2-content').prepend(sweet_loader);
		}
	});
}

function successAlert(html) {
	swal.fire({
		icon: 'success',
		showConfirmButton:false,
		html: html
	});
}

function errorAlert(html) {
	swal.fire({
		icon: 'error',
		showConfirmButton: true,
		html: html
	});
}