import Swal from 'sweetalert2';

/**
 * Central UI feedback helpers built on SweetAlert2.
 *
 * Exposed globally as `window.ui` so any inline script (e.g. form handlers,
 * tool engines) can raise consistent, accessible feedback without importing
 * its own copy. Styling matches the site palette via a shared class + CSS
 * custom buttons defined in the layout stylesheet.
 */

const DARK_INK = '#162033';

const baseOptions = {
    buttonsStyling: false,
    customClass: {
        container: 'ui-dialog',
        popup: 'ui-popup',
        title: 'ui-title',
        htmlContainer: 'ui-html',
        confirmButton: 'btn ui-btn',
        cancelButton: 'btn secondary ui-btn',
        closeButton: 'ui-close',
        icon: 'ui-icon',
    },
};

function toast(swalTitle) {
    return Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3200,
        timerProgressBar: true,
        didOpen: (el) => {
            el.addEventListener('mouseenter', Swal.stopTimer);
            el.addEventListener('mouseleave', Swal.resumeTimer);
        },
        ...swalTitle,
    });
}

const toastApi = toast({});

window.ui = {
    /** Small success notification. */
    success(message, title = 'Done!') {
        return toastApi.fire({ icon: 'success', title, text: message });
    },

    /** Small error notification. */
    error(message, title = 'Something went wrong') {
        return toastApi.fire({ icon: 'error', title, text: message });
    },

    /** Small informational notification. */
    info(message, title = 'Heads up') {
        return toastApi.fire({ icon: 'info', title, text: message });
    },

    /** Small warning notification. */
    warning(message, title = 'Careful') {
        return toastApi.fire({ icon: 'warning', title, text: message });
    },

    /** Modal confirmation dialog resolving true when confirmed. */
    confirm({
        title = 'Are you sure?',
        text = '',
        confirmText = 'Yes, continue',
        cancelText = 'Cancel',
        icon = 'question',
    } = {}) {
        return Swal.fire({
            ...baseOptions,
            icon,
            title,
            text,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            reverseButtons: true,
            focusCancel: true,
        }).then((result) => result.isConfirmed);
    },

    /** Full success modal (e.g. a big finish moment). */
    modalSuccess({ title = 'All done!', text = '', confirmText = 'Great' } = {}) {
        return Swal.fire({
            ...baseOptions,
            icon: 'success',
            title,
            text,
            confirmButtonText: confirmText,
        });
    },

    /** Full error modal for blocking failures. */
    modalError({ title = 'Something went wrong', text = '', confirmText = 'OK' } = {}) {
        return Swal.fire({
            ...baseOptions,
            icon: 'error',
            title,
            text,
            confirmButtonText: confirmText,
        });
    },

    /** Expose raw Swal for advanced one-off dialogs. */
    Swal,
};

export default window.ui;
