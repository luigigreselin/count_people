const videoPlayer = document.getElementById('video-player');
const videoSource = document.getElementById('video-source');
const dragDropArea = document.getElementById('drag-drop-area');
const outputImage = document.getElementById('output-image');

// Add event listener for dragover event
dragDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dragDropArea.classList.add('hover');
});

dragDropArea.addEventListener('dragleave', () => {
    dragDropArea.classList.remove('hover');
});

// Add event listenere for drop event
dragDropArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragDropArea.classList.remove('hover');

    const file = e.dataTransfer.files[0];
    const fileType = file.type;

    // Clear previous output
    outputImage.innerHTML = "";

    // Create a dummy video element to test browser support
    const testVideo = document.createElement('video');

    if (fileType.startsWith('image/')) {
        await handleImageUpload(file);
    } else if (fileType.startsWith('video/') && (testVideo.canPlayType(fileType) === 'probably' || testVideo.canPlayType(fileType) === 'maybe')) {
        await handleVideoUpload(file);
    } else {
        let alert_msg = 'Input file format (" + file.type + ") is not allowed or not supported by your browser.'
        alert(alert_msg);
        return;
    }
});

// Function to handle image upload
async function handleImageUpload(file) {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await fetch('/image', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            outputImage.innerHTML = `<img src="data:image/jpeg;base64, ${result.image} " alt="Detected Image"/>`;
        } else {
            outputImage.innerHTML = `<p>Error uploading file</p>`;
        }
    } catch (error) {
        outputImage.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Function to handle video upload
async function handleVideoUpload(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Function to handle streaming the video in chunks
        const fetchVideoChunk = async (rangeStart = 0, chunkSize = 1024 * 1024) => {
            const rangeHeader = `bytes=${rangeStart}-${rangeStart + chunkSize - 1}`;
            const response = await fetch('/video', {
                method: 'POST',
                headers: {
                    'Range': rangeHeader
                },
                body: formData
            });

            if (response.ok) {
                const videoBlob = await response.blob();  // Get the video data as a blob
                const videoURL = URL.createObjectURL(videoBlob);  // Create a URL for the video blob

                // Create video element dynamically
                const videoElement = document.createElement('video');
                videoElement.controls = true;  // Add controls like play, pause, etc.
                videoElement.width = 600;
                videoElement.height = 400;

                const sourceElement = document.createElement('source');
                sourceElement.src = videoURL;
                sourceElement.type = file.type;
                videoElement.appendChild(sourceElement);

                // Add the video element to the DOM
                outputImage.appendChild(videoElement)

                // Play the video automatically
                videoElement.play();

            } else {
                alert('Only .mp4 and .mov files are supported!');
            }
        };

        // Fetch the first chunk (or adjust the chunk size as needed)
        await fetchVideoChunk();
    } catch (error) {
        outputImage.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}
