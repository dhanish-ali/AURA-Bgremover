// Import the background removal function from the library
import removeBackground from '@imgly/background-removal';

// === DOM Element References ===
const uploadSection = document.getElementById('upload-section');
const resultSection = document.getElementById('result-section');
const loadingState = document.getElementById('loading-state');
const resultState = document.getElementById('result-state');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const originalImagePreview = document.getElementById('original-image-preview');
const resultImagePreview = document.getElementById('result-image-preview');
const downloadBtn = document.getElementById('download-btn');
const startOverBtn = document.getElementById('start-over-btn');

let resultBlobUrl = null; // To store the URL of the processed image blob

// === Core Function to Handle Image Processing ===
const handleImage = (file) => {
    // Validate that the file is an image
    if (!file || !file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, WEBP).');
        return;
    }

    // Show the processing UI
    uploadSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    loadingState.classList.remove('hidden');
    resultState.classList.add('hidden');
    
    // Display the original image using FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImagePreview.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // --- AI Background Removal ---
    removeBackground(file, {
        // You can specify output format and quality. PNG is best for transparency.
        output: {
            format: 'image/png',
            quality: 1.0 // Highest quality
        }
    })
    .then((blob) => {
        // Create a URL from the returned Blob object to display the image
        resultBlobUrl = URL.createObjectURL(blob);
        resultImagePreview.src = resultBlobUrl;

        // Hide loader and show the final result
        loadingState.classList.add('hidden');
        resultState.classList.remove('hidden');
    })
    .catch((error) => {
        console.error('Error removing background:', error);
        // Using a custom modal or message box would be better than alert in a real app
        alert(`An error occurred: ${error.message}. Please try another image.`);
        resetUI(); // Reset on error
    });
};

// === UI Reset Function ===
const resetUI = () => {
    // Revoke the old blob URL to free up memory
    if (resultBlobUrl) {
        URL.revokeObjectURL(resultBlobUrl);
        resultBlobUrl = null;
    }
    // Reset UI to the initial state
    uploadSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    fileInput.value = ''; // Clear the file input
    originalImagePreview.src = '#'; // Clear preview images
    resultImagePreview.src = '#';
};

// === Event Listeners ===

// Listen for file selection via the button
fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        handleImage(e.target.files[0]);
    }
});

// Listen for the "Start Over" button click
startOverBtn.addEventListener('click', resetUI);

// Listen for the "Download" button click
downloadBtn.addEventListener('click', () => {
    if (!resultBlobUrl) return;
    
    // Create a temporary link to trigger the download
    const link = document.createElement('a');
    link.href = resultBlobUrl;
    
    // Suggest a filename for the download
    const originalFilename = fileInput.files[0]?.name || 'image.png';
    const filenameWithoutExt = originalFilename.split('.').slice(0, -1).join('.') || 'download';
    link.download = `${filenameWithoutExt}-bg-removed.png`;
    
    // Programmatically click the link and then remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// --- Drag and Drop Listeners ---
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault(); // Necessary to allow dropping
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); // Prevent the browser from opening the file
    dropZone.classList.remove('drag-over');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        fileInput.files = e.dataTransfer.files; // Sync the file list with the file input
        handleImage(file);
    }
});