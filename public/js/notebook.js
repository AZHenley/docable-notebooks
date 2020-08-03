let markdownContent;
let IR;

document.getElementById("input-file").addEventListener('change', getFile);

function getFile(event) {
    const input = event.target
    if ('files' in input && input.files.length > 0) {
        readFileContent(input.files[0]).then(content => {
            markdownContent = content;
            // using /markdown endpoint to do md2html
            fetch('/markdown', {
                method: 'POST',
                mode: 'cors',
                body: content,
                headers: { "content-type": "text/plain; charset=UTF-8" },
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById("main").innerHTML = data.html;
                IR = data.IR;
            });
        }).catch(error => console.log(error))
    };
}

function readFileContent(file) {
    const reader = new FileReader()
    return new Promise((resolve, reject) => {
        reader.onload = event => resolve(event.target.result)
        reader.onerror = error => reject(error)
        reader.readAsText(file)
    });
}

function submitButtonSpinToggle() {
    $('#submit-button').toggleClass('spinner-border spinner-border-sm');
}

$('#submit').click(function () {

    submitButtonSpinToggle();

    fetch('/run', {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ markdownContent }),
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .then(response => response.text())
    .then(data => {
        const results = JSON.parse(data);
        for (const result of results) {
            // selecting cells using index to adding results
            let cell = $('[data-docable="true"]').eq(result.cell.index);
            let selector = cell.parent().next('.docable-cell-output');

            setResults(selector, result.result);
        }

        submitButtonSpinToggle();
    });

});

$('main').on('click', 'button.play-btn', function () {
    submitButtonSpinToggle();

    let stepIndex = $('pre[data-docable="true"]').index($(this).siblings('pre[data-docable="true"]'));

    fetch('/run', {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ markdownContent, stepIndex }),
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
        .then(response => response.text())
        .then(data => {
            const results = JSON.parse(data);
            for (const result of results) {
                // selecting cells using index to adding results
                let cell = $('[data-docable="true"]').eq(result.cell.index);
                let selector = cell.parent().next('.docable-cell-output');

                setResults(selector, result.result);
            }

            submitButtonSpinToggle();
        });
})

function setResults(selector, result) {
    if (!result) return;

    if (result.status)
        _setPassing(selector);
    else
        _setFailing(selector, result);
    return result;
}

function _setPassing(selector) {
    selector.prepend('<span>✓ </span>');
    selector.addClass('passing');
}

function _setFailing(selector, response) {
    selector.prepend('<span>𐄂 </span>');
    selector.append(`<br/><br/>`);
    selector.append(`<span>️ error: ${response.error || response.stderr}</span> </br>`);
    selector.append(`<span> exit code: ${response.exitCode}</span> </br>`);
    selector.append(`<span> command output: ${response.stdout || '""'}</span> </br>`);
    selector.addClass('failing');
}

