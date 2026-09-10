(function () {
	'use strict';

	var POPUP_ID = '729';
	var MODAL_ID = 'elementor-popup-modal-' + POPUP_ID;
	var POPUP_SELECTOR = '[data-elementor-id="' + POPUP_ID + '"]';
	var TRIGGER_SELECTOR = 'a[href="#devis-gratuit"], a[href*="popup%3Aopen"], a[href*="popup:open"]';
	var CLOSE_ICON =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1em" height="1em" aria-hidden="true">' +
		'<path d="M742 167L500 408 258 167C246 154 233 150 217 150 196 150 179 158 167 167 154 179 150 196 150 212 150 229 154 242 171 254L408 500 167 742C138 771 138 800 167 829 196 858 225 858 254 829L496 587 738 829C750 842 767 846 783 846 800 846 817 842 829 829 842 817 846 804 846 783 846 767 842 750 829 737L588 500 833 258C863 229 863 200 833 171 804 137 775 137 742 167Z"/>' +
		'</svg>';

	function init() {
		var popupContent = document.querySelector(POPUP_SELECTOR);
		if (!popupContent) {
			return;
		}

		// Elementor Pro crée parfois un modal vide en site statique.
		var existingModal = document.getElementById(MODAL_ID);
		if (existingModal) {
			existingModal.remove();
		}

		popupContent.removeAttribute('data-elementor-type');

		var modal = document.createElement('div');
		modal.id = MODAL_ID;
		modal.className =
			'elementor-popup-modal dialog-type-lightbox dialog-lightbox-widget dialog-widget elementor-location-popup devis-popup-modal';
		modal.setAttribute('role', 'dialog');
		modal.setAttribute('aria-modal', 'true');
		modal.setAttribute('aria-hidden', 'true');
		modal.setAttribute('aria-labelledby', 'devis-popup-title');

		var widgetContent = document.createElement('div');
		widgetContent.className = 'dialog-widget-content dialog-lightbox-widget-content';

		var message = document.createElement('div');
		message.className = 'dialog-message dialog-lightbox-message';

		var closeBtn = document.createElement('button');
		closeBtn.type = 'button';
		closeBtn.className = 'dialog-close-button dialog-lightbox-close-button';
		closeBtn.setAttribute('aria-label', 'Fermer');
		closeBtn.innerHTML = CLOSE_ICON;

		message.appendChild(popupContent);
		widgetContent.appendChild(message);
		widgetContent.insertBefore(closeBtn, widgetContent.firstChild);
		modal.appendChild(widgetContent);
		document.body.appendChild(modal);

		var title = popupContent.querySelector('.elementor-heading-title');
		if (title) {
			title.id = 'devis-popup-title';
		}

		var form = popupContent.querySelector('.elementor-form');
		if (form) {
			form.addEventListener('submit', onFormSubmit);
		}

		function openPopup() {
			modal.classList.add('is-open');
			modal.setAttribute('aria-hidden', 'false');
			document.body.classList.add('devis-popup-open');
			closeBtn.focus();
		}

		function closePopup() {
			modal.classList.remove('is-open');
			modal.setAttribute('aria-hidden', 'true');
			document.body.classList.remove('devis-popup-open');
		}

		function onFormSubmit(event) {
			event.preventDefault();

			if (!form.checkValidity()) {
				form.reportValidity();
				return;
			}

			var wrapper = form.closest('.elementor-widget-form');
			var existingMessage = wrapper && wrapper.querySelector('.elementor-message');
			if (existingMessage) {
				existingMessage.remove();
			}

			var success = document.createElement('div');
			success.className = 'elementor-message elementor-message-success';
			success.setAttribute('role', 'alert');
			success.textContent =
				'Merci ! Votre demande a bien été envoyée. Nous vous recontacterons très rapidement.';
			form.insertAdjacentElement('beforebegin', success);
			form.reset();

			window.setTimeout(closePopup, 3500);
		}

		closeBtn.addEventListener('click', closePopup);

		modal.addEventListener('click', function (event) {
			if (event.target === modal) {
				closePopup();
			}
		});

		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
				closePopup();
			}
		});

		document.addEventListener(
			'click',
			function (event) {
				var link = event.target.closest('a');
				if (!link || !link.matches(TRIGGER_SELECTOR)) {
					return;
				}
				event.preventDefault();
				event.stopImmediatePropagation();
				openPopup();
			},
			true
		);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
