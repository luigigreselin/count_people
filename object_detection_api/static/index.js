const dragDropArea = document.getElementById("dragDropArea");
const output = document.getElementById("output");

// Step 1 - Add an event listener for the dragover event
dragDropArea.addEventListener("dragover", (e) => {
    e.preventDefault();  // This turns off the browser's default drag and drop handler.
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
    output_image.innerHTML = "";
    output_analysis.innerHTML = "";

    for (const file of files) {
        if (file.type.startsWith("image/")) {

            const formData = new FormData();  // Initialize FormData correctly
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
            const reader = new FileReader();
            reader.onerror = (err) => {
                console.error("Error reading file:", err);
                alert("An error occurred while reading the file.");
            };
            reader.readAsDataURL(file);
    }
        else if (file.type === "video/mp4") {
            const formData = new FormData();  // Initialize FormData correctly
            formData.append('file', file);

            try {
                // Define a function to handle streaming the video in chunks
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

                        // Append the video to the DOM (or update the source)
                        const videoElement = document.createElement("video");
                        videoElement.src = videoURL;
                        videoElement.controls = true;
                        output.appendChild(videoElement);
                    } else {
                        output.innerHTML = `<p>Error fetching video chunk</p>`;
                    }
                };

                // Fetch the first chunk (or adjust the chunk size as needed)
                await fetchVideoChunk();

            } catch (error) {
                output.innerHTML = `<p>Error: ${error.message}</p>`;
            }
            const reader = new FileReader();
            reader.onerror = (err) => {
                console.error("Error reading file:", err);
                alert("An error occurred while reading the file.");
            };
            reader.readAsDataURL(file);  // Read the video file to preview it
        }
    else {
        alert("Only image adn mp4 files are allowed.");
        return;
    }


}
});
