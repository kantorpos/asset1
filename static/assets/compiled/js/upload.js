$(document).ready(function () {

    const $fileInput = $("#file");
    const $descriptionInput = $("#description");
    const $selectedFile = $("#selected-file");
    const $fileLabel = $("#file-label");
    const $nameInput = $("#name");
    const $uploadButton = $('#upload-button');
    const $versionInput = $('#version');
    const $fileType = $('#file-type');

    $fileInput.on("change", function () {
        if ($(this)[0].files.length > 0) {
            const file = $(this)[0].files[0];
            const fileName = file.name;
            let fileType = file.type;

            // Check if the file extension is .crl
            const fileExtension = fileName.split('.').pop().toLowerCase();
            if (fileExtension === 'crl') {
                fileType = 'application/pkix-crl';
            }

            $selectedFile.text(`Selected file: ${fileName}`);
            $fileType.text(fileType);
            $fileLabel.text("Change file");
            $nameInput.val(fileName)
            console.log("Tipe :", $fileType.text());
            console.log(fileType);
        } else {
            $selectedFile.text("No file selected");
            $fileLabel.text("Choose a file");
        }
    });

    $uploadButton.on('click', async function () {
        $('#loading-progress').css('display', 'block');
        const fileInputData = $('#file')[0].files[0]; // Mengambil file dari elemen input
        const csrfToken = $("input[name='csrf_token']").val();
        if (fileInputData) {
            setTimeout(async () => {
                const base64File = await readFileAsBase64(fileInputData);
                const uploadData = {
                    name: $nameInput.val(),
                    description: $descriptionInput.val(),
                    version: $versionInput.val(),
                    file: base64File,
                    type: $fileType.text()
                };

                $.ajax({
                    url: '/upload',
                    type: 'POST',
                    data: JSON.stringify(uploadData),
                    contentType: 'application/json',
                    headers: {
                        "X-CSRF-Token": csrfToken // Menambahkan header CSRF
                    },
                    beforeSend: function () {
                        showProcessing()
                    },
                    statusCode: {
                        403: function () {
                            // Mengarahkan pengguna ke halaman login
                            window.location.href = "/login";
                        }
                    },
                    success: function (response) {
                        showSuccessModal('Data berhasil di unggah.');
                        console.log('Response:', response.message);
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        showErrorModal('Terjadi kesalahan saat mengunggah data: ' + xhr.responseText);
                        console.error('Error:', errorThrown);
                    },
                    complete: function () {
                        // Blok ini akan selalu dijalankan, baik request sukses maupun gagal
                    }
                });
            }, 500);
        } else {
            showError('Pilih file terlebih dahulu.');
        }
    });

    $('#close-success').on('click', function () {
        $('#success-popup').css('display', 'none');
        resetForm();
    });

    $('#close-error').on('click', function () {
        $('#error-popup').css('display', 'none');
        resetForm();
    });

    function resetForm() {
        $nameInput.val('');
        $versionInput.val('');
        $fileInput.val('');
        $selectedFile.text('No file selected');
        $fileLabel.text('Choose a file');
    }

    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }


});