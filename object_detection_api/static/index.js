const dragDropArea = document.getElementById("dragDropArea");
// const output = document.getElementById("output");
const output_image = document.getElementById("output_image");
const output_analysis = document.getElementById("output_analysis");

// Step 1 - Add an event listener for the dragover event
dragDropArea.addEventListener("dragover", (e) => {
    e.preventDefault();  // Prevent the default browser behavior
    dragDropArea.classList.add("dragover");
});

// Step 2 - Add an event listener for the drop event
dragDropArea.addEventListener("drop", async (e) => {
    e.preventDefault();
    dragDropArea.classList.remove("dragover");

    const files = e.dataTransfer.files;
    if (files.length === 0) {
        alert("No files selected.");
        return;
    }

    // Clear previous output
    output_image.innerHTML = "";
    output_analysis.innerHTML = "";

    for (const file of files) {
        if (file.type.startsWith("image/")) {
            await handleImageUpload(file);
        } else if (file.type === "video/mp4") {
            await handleVideoUpload(file);
        } else {
            alert("Only image and MP4 files are allowed.");
            return;
        }
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
            output_analysis.innerHTML = `<p>Detected Objects:</p><pre>${JSON.stringify(result.detections, null, 2)}</pre>`;
            output_image.innerHTML += `<p>Image:</p><img src="data:image/jpeg;base64,${result.image}" alt="Detected Image"/>`;
        } else {
            output_image.innerHTML = `<p>Error uploading file</p>`;
        }
    } catch (error) {
        output_image.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

async function handleVideoUpload(file) {
    const chunkSize = 1024 * 1024; // 1MB chunk size
    let currentChunk = 0;  // Track the current chunk

    const fetchVideoChunk = async (rangeStart) => {
        // Calculate the end of the chunk range
        const rangeEnd = Math.min(file.size, rangeStart + chunkSize);
        console.log(`Uploading chunk: Start = ${rangeStart}, End = ${rangeEnd}`);
        // Slice the file into a chunk
        const fileChunk = file.slice(rangeStart, rangeEnd);

        // Create a new FormData for each chunk
        const formData = new FormData();
        formData.append('file', fileChunk);  // Append only the current chunk

        // Send the chunk via POST request
        const rangeHeader = `bytes=${rangeStart}-${rangeEnd - 1}`;  // Set content range
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

            // Append the video to the DOM if it's the first chunk
            if (currentChunk === 0) {
                const videoElement = document.createElement("video");
                videoElement.src = videoURL;
                videoElement.controls = true;
                output_image.appendChild(videoElement);
            }

            // Fetch the next chunk if the video is not fully uploaded
            if (rangeEnd < file.size) {
                currentChunk++;
                await fetchVideoChunk(rangeEnd);  // Fetch the next chunk
            }
        } else {
            output_image.innerHTML = `<p>Error fetching video chunk</p>`;
        }
    };

    try {
        // Start fetching the first chunk
        await fetchVideoChunk(0);
    } catch (error) {
        output_image.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}
