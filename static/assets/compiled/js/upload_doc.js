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
            if (fileExtension === 'rar') {
                fileType = 'application/x-rar';
            }
            if (fileExtension === 'zip') {
                fileType = 'application/zip';
            }
            $nameInput.val(fileName)
            $selectedFile.text(`Selected file: ${fileName}`);
            $fileType.text(fileType);
            $fileLabel.text("Change file");

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
                    type: $fileType.text(),
                    status: "private"
                };

                $.ajax({
                    url: '/upload_doc',
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
            }, 100);
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

    let projectID = $('#git-name').val();
    const $branchSelect = $('#branch');
    const $versionSelect = $('#version_git');
    const $submitGit = $('#upload-git');

    toggleSelect2($branchSelect, false);
    toggleSelect2($versionSelect, false);
    // Inisialisasi dropdown Select2 dan toggle submit button saat perubahan terjadi
    $('#branch').select2({theme: 'bootstrap4',width: '100%'})
    $('#version_git').select2({theme: 'bootstrap4',width: '100%'})
    // Inisialisasi Select2 untuk Git Name, Branch, dan Version
    $('#git-name').select2({
        theme: 'bootstrap4',
        placeholder: 'Select a Git Name',
        width: '100%'
    });

    $('#git-tab').on('click', function(e) {
        e.preventDefault(); // Mencegah perilaku default dari klik

        // Lakukan GET request ke endpoint /api/project
        $.ajax({
            url: '/api/project', // URL endpoint yang mengembalikan data proyek
            method: 'GET',
            beforeSend: function () {
                showProcessing()
            },

            complete: function() {
                Swal.close(); // Menutup loading
            },
            success: function(response) {
                // Kosongkan select sebelum mengisi ulang
                // Kosongkan select sebelum mengisi ulang
                $('#git-name').empty();

                // Cek apakah proyek ada dalam respons
                if (response.Projects && response.Projects.length > 0) {
                    // Isi elemen select dengan opsi dari data proyek
                    response.Projects.forEach(function(project) {
                        const option = $('<option></option>')
                            .attr('value', project.id) // Set nilai opsi
                            .text(project.name); // Set teks opsi
                        $('#git-name').append(option);
                    });
                    projectID = $('#git-name').val();
                    loadBranches(projectID);

                } else {
                    // Menampilkan pesan jika tidak ada proyek
                    $('#git-name').append('<option disabled>No projects available</option>');
                }

            },
            error: function(xhr, status, error) {
                console.error('Error loading projects:', error);
            }
        });
    });


    // Fungsi untuk mengaktifkan atau menonaktifkan tombol Submit
    function toggleSubmitButton() {
        let hasBranch = $('#branch').val() !== null && $('#branch').val() !== "";
        let hasVersion = $('#version_git').val() !== null && $('#version_git').val() !== "";
        let downloadType = $('input[name="downloadType"]:checked').val();

        if (downloadType === 'branch' && hasBranch) {
            $submitGit.prop('disabled', false);
        } else if (downloadType === 'version' && hasVersion) {
            $submitGit.prop('disabled', false);
        } else {
            $submitGit.prop('disabled', true);
        }
    }
    // Fungsi untuk men-disable/enable Select2
    function toggleSelect2($selectElement, enable) {
        if (enable) {
            $selectElement.prop('disabled', false);
        } else {
            $selectElement.prop('disabled', true);
        }
        $selectElement.select2({
            placeholder: enable ? 'Select an option' : 'No options available',
            width: '100%'
        });
    }

    // Menampilkan Dropdown yang Sesuai Berdasarkan Pilihan (Branch atau Version)
    $('input[name="downloadType"]').on('change', function() {
        projectID = $('#git-name').val();
        if ($(this).val() === 'branch') {
            // Tampilkan dropdown branch, sembunyikan dropdown version
            $('#branch-group, #branch-label').removeClass('d-none');
            $('#version-group, #version-label').addClass('d-none');
            loadBranches(projectID);
        } else {
            // Tampilkan dropdown version, sembunyikan dropdown branch
            $('#branch-group, #branch-label').addClass('d-none');
            $('#version-group, #version-label').removeClass('d-none');
            loadVersions(projectID);
        }
        toggleSubmitButton();
    });

    // Mengambil Branches berdasarkan Git Name
    $('#git-name').on('change', function() {
        let projectID = $(this).val();

        if (projectID) {
            let selectedType = $('input[name="downloadType"]:checked').val();
            if (selectedType === 'branch') {
                loadBranches(projectID);
            } else if (selectedType === 'version') {
                loadVersions(projectID);
            }
        }
    });

    // Mengambil branches dari server
    function loadBranches(projectID) {
        $.ajax({
            url: '/api/project-branches/' + projectID,
            method: 'GET',
            beforeSend: function () {
                showProcessing()
            },

            complete: function() {
                Swal.close(); // Menutup loading
            },
            success: function(response) {
                $('#branch').empty();
                if (response.branches && response.branches.length > 0) {
                    response.branches.forEach(function(branch) {
                        $('#branch').append(new Option(branch, branch, false, false));
                    });
                    toggleSelect2($branchSelect, true);
                } else {
                    $('#branch').append(new Option('No branches found', '', false, false));
                    toggleSelect2($branchSelect, false);
                }
                $('#branch').trigger('change');


                toggleSubmitButton();
            },
            error: function() {
                $('#branch').empty().append(new Option('Error fetching branches', '', false, false));
                $('#branch').trigger('change');
                toggleSelect2($branchSelect, false);
                toggleSubmitButton();
            }
        });
    }

    // Mengambil versions dari server
    function loadVersions(projectID) {
        $.ajax({
            url: '/api/project-versions/' + projectID,
            method: 'GET',
            beforeSend: function () {
                showProcessing()
            },

            complete: function() {
                Swal.close(); // Menutup loading
            },
            success: function(response) {
                $('#version_git').empty();
                if (response.versions && response.versions.length > 0) {
                    response.versions.forEach(function(version) {
                        $('#version_git').append(new Option(version, version, false, false));
                        toggleSelect2($versionSelect, true);
                    });
                } else {
                    $('#version_git').append(new Option('No versions found', '', false, false));
                    toggleSelect2($versionSelect, false);
                }
                $('#version_git').trigger('change');

                toggleSubmitButton();
            },
            error: function() {
                $('#version_git').empty().append(new Option('Error fetching versions', '', false, false));
                $('#version_git').trigger('change');
                toggleSelect2($versionSelect, false);
                toggleSubmitButton();
            }
        });
    }



    // Disable tombol Submit secara default
    $submitGit.prop('disabled', true);

    $('#upload-git').on('click', function() {
        let $this = $(this); // Menyimpan referensi tombol
        $this.prop('disabled', true); // Menonaktifkan tombol untuk mencegah klik ganda

        let projectID = $('#git-name').val();
        let downloadType = $('input[name="downloadType"]:checked').val();
        let branch = $('#branch').val();
        let version = $('#version_git').val();
        let csrfToken = $("input[name='csrf_token']").val();

        // Mendapatkan nama dari opsi yang dipilih
        let projectName = $('#git-name option:selected').text();

        let requestData = {
            projectID: projectID,
            type: downloadType,
            name: projectName
        };

        if (downloadType === 'branch') {
            requestData.branch = branch;
        } else if (downloadType === 'version') {
            requestData.version = version;
        }

        $.ajax({
            url: '/api/upload_git',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            headers: {
                "X-CSRF-Token": csrfToken // Menambahkan header CSRF
            },
            beforeSend: function() {
                showProcessing();
            },
            statusCode: {
                403: function() {
                    // Mengarahkan pengguna ke halaman login
                    window.location.href = "/login";
                }
            },
            success: function(response) {
                showSuccessModal('Data berhasil di unggah.');
                console.log('Response:', response.message);
            },
            error: function(xhr, textStatus, errorThrown) {
                showErrorModal('Terjadi kesalahan saat mengunggah data: ' + xhr.responseText);
                console.error('Error:', errorThrown);
            },
            complete: function() {
                // Mengaktifkan kembali tombol setelah request selesai
                $this.prop('disabled', false);
            }
        });
    });
});