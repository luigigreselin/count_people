const dragDropArea = document.getElementById('drag-drop-area');
const urlInput = document.getElementById('url-input');
const outputImage = document.getElementById('output-image');


// Add event listener for text insert event
urlInput.addEventListener('change', function() {
    // Regular expression for basic URL validation
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/;
    console.log('URL populated')

    // Clear previous output
    outputImage.innerHTML = "";

    if (urlPattern.test(this.value)) {
        identifyUrlType(this.value)
    } else {
        alert('Please enter a valid URL (e.g., https://example.com)');
        this.value = '';
    }
});

// Add event listener for drag-over event
dragDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dragDropArea.classList.add('hover');
});

// Add event listener for drag-leave event
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
        let alert_msg = 'Input file format (' + file.type + ') is not allowed or not supported by your browser.'
        alert(alert_msg);
        return;
    }
});

async function identifyUrlType(url) {
    try {
        // Decode the URL first to handle encoded characters
        const decodedUrl = decodeURIComponent(url);
        const lowercaseUrl = decodedUrl.toLowerCase();
        let urlType = '';
        console.log('Decoded URL:', decodedUrl);

        // Common image extensions
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];

        // Common video extensions
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'];

        if (videoExtensions.some(ext => lowercaseUrl.endsWith(ext))) {
            console.log('Found extensions:', imageExtensions.filter(ext => lowercaseUrl.endsWith(ext)));
            urlType = 'video';
            console.log('URL detected type:', urlType);
        } else if (imageExtensions.some(ext => lowercaseUrl.endsWith(ext))) {
            console.log('Found extensions:', imageExtensions.filter(ext => lowercaseUrl.endsWith(ext)));
            urlType = 'image';
            console.log('URL detected type:', urlType);

            // Fetch the image
            const response = await fetch(lowercaseUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get the blob data
            const blob = await response.blob();
            console.log('Fetch image type:', blob.type);

            handleImageUpload(blob)
        } else {
            urlType = 'unknown';
            console.log('URL detected type:', urlType);
        }

        return urlType;

    } catch (error) {
        console.error('Error decoding URL:', error);
        alert('Error processing URL');
        return 'error';
    }
}

// Function to handle image upload
async function handleImageUpload(file) {
    const formData = new FormData();
    formData.append('file', file);
    console.log('Drop image type:', file.type);
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

// Function to upload chunk to server and get processed chunk
async function handleVideoUpload(file) {
    const chunkSize = 1024 * 1024;  // 1MB chunks
    let start = 0;
    let processedChunks = [];

    // Create a video element
    const videoElement = document.createElement('video');
    videoElement.controls = true;
    videoElement.width = 600;
    videoElement.height = 400;

    // Add the video element to the DOM
    outputImage.appendChild(videoElement);

    // Function to read and upload file chunks
    async function readAndUploadChunk() {
        const reader = new FileReader();
        const blob = file.slice(start, start + chunkSize);

        reader.onload = async (e) => {
            const chunk = e.target.result;

            try {
                const processedChunk = await uploadAndProcessChunk(chunk);
                processedChunks.push(processedChunk);
                updateVideoSource();
                start += chunk.byteLength;

                if (start < file.size) {
                    readAndUploadChunk();
                } else {
                    console.log('Upload completed');
                }
            } catch (error) {
                console.error('Error uploading/processing chunk:', error);
            }
        };

        reader.readAsArrayBuffer(blob);
    }

    // Function to upload chunk to server and get processed chunk
    async function uploadAndProcessChunk(chunk) {
        const formData = new FormData();
        formData.append('file', new Blob([chunk]), file.name);

        try {
            const response = await fetch('/video', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }

            return await response.blob();
        } catch (error) {
            console.error('Error in uploadAndProcessChunk:', error);
            return null;
        }
    }

    // Function to update video source with processed chunks
    function updateVideoSource() {
        const blob = new Blob(processedChunks);
        const videoURL = URL.createObjectURL(blob);

        videoElement.src = videoURL;
    }

    // Start reading, uploading, and processing chunks
    readAndUploadChunk();

    // Play the video when there's enough data
    videoElement.addEventListener('canplay', () => {
        videoElement.play();
    });
}
