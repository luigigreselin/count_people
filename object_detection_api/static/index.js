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
    output.innerHTML = "";

    for (const file of files) {
        if (!file.type.startsWith("image/")) {
            alert("Only image files are allowed.");
            return;
        }
        const formData = new FormData();  // Initialize FormData correctly
        formData.append('file', file);  
        
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                output.innerHTML = `<p>Detected Objects:</p><pre>${JSON.stringify(result.detections, null, 2)}</pre>`;
                output.innerHTML += `<p>Image:</p><img src="data:image/jpeg;base64,${result.image}" alt="Detected Image"/>`;
            } else {
                output.innerHTML = `<p>Error uploading file</p>`;
            }
        } catch (error) {
            output.innerHTML = `<p>Error: ${error.message}</p>`;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement("img");
            img.src = e.target.result;
            output.appendChild(img);
        };
        reader.onerror = (err) => {
            console.error("Error reading file:", err);
            alert("An error occurred while reading the file.");
        };
        reader.readAsDataURL(file);
    }
});
