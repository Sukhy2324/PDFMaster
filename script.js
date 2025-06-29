// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    
    // DOM elements
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const imagePreview = document.getElementById('imagePreview');
    const clearBtn = document.getElementById('clearBtn');
    const convertBtn = document.getElementById('convertBtn');
    const previewBtn = document.getElementById('previewBtn');
    const previewModal = document.getElementById('previewModal');
    const closeBtn = document.querySelector('.close-btn');
    const downloadPreviewBtn = document.getElementById('downloadPreviewBtn');
    const pdfPreview = document.getElementById('pdfPreview');
    
    // Options elements
    const pageSize = document.getElementById('pageSize');
    const customSizeGroup = document.getElementById('customSizeGroup');
    const customWidth = document.getElementById('customWidth');
    const customHeight = document.getElementById('customHeight');
    const pageOrientation = document.getElementById('pageOrientation');
    const pageLayout = document.getElementById('pageLayout');
    const marginSize = document.getElementById('marginSize');
    const customMarginGroup = document.getElementById('customMarginGroup');
    const customMargin = document.getElementById('customMargin');
    const borderStyle = document.getElementById('borderStyle');
    const borderOptions = document.getElementById('borderOptions');
    const borderWidth = document.getElementById('borderWidth');
    const borderColor = document.getElementById('borderColor');
    const imageFit = document.getElementById('imageFit');
    const pdfName = document.getElementById('pdfName');
    
    // Store uploaded images
    let uploadedImages = [];
    
    // Event listeners for option changes
    pageSize.addEventListener('change', function() {
        customSizeGroup.classList.toggle('hidden', this.value !== 'custom');
    });
    
    marginSize.addEventListener('change', function() {
        customMarginGroup.classList.toggle('hidden', this.value !== 'custom');
    });
    
    borderStyle.addEventListener('change', function() {
        borderOptions.classList.toggle('hidden', this.value === 'none');
    });
    
    // Initialize options
    customSizeGroup.classList.add('hidden');
    customMarginGroup.classList.add('hidden');
    borderOptions.classList.add('hidden');
    
    // File input change event
    fileInput.addEventListener('change', handleFiles);
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files } });
    }
    
    // Handle selected files
    function handleFiles(e) {
        const files = e.target.files;
        if (!files.length) return;
        
        Array.from(files).forEach(file => {
            if (!file.type.match('image.*')) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const image = {
                    src: e.target.result,
                    file: file,
                    name: file.name
                };
                uploadedImages.push(image);
                updateImagePreview();
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Update image preview section
    function updateImagePreview() {
        imagePreview.innerHTML = '';
        
        if (uploadedImages.length === 0) {
            document.getElementById('previewSection').style.display = 'none';
            return;
        }
        
        document.getElementById('previewSection').style.display = 'block';
        
        uploadedImages.forEach((image, index) => {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'preview-image';
            
            const img = document.createElement('img');
            img.src = image.src;
            img.alt = image.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.onclick = () => removeImage(index);
            
            previewDiv.appendChild(img);
            previewDiv.appendChild(removeBtn);
            imagePreview.appendChild(previewDiv);
        });
    }
    
    // Remove image from preview
    function removeImage(index) {
        uploadedImages.splice(index, 1);
        updateImagePreview();
    }
    
    // Clear all images
    clearBtn.addEventListener('click', function() {
        uploadedImages = [];
        updateImagePreview();
        fileInput.value = '';
    });
    
    // Convert to PDF
    convertBtn.addEventListener('click', function() {
        if (uploadedImages.length === 0) {
            alert('Please upload at least one image');
            return;
        }
        
        const pdf = createPDF();
        pdf.save(pdfName.value || 'converted.pdf');
    });
    
    // Preview PDF
    previewBtn.addEventListener('click', function() {
        if (uploadedImages.length === 0) {
            alert('Please upload at least one image');
            return;
        }
        
        const pdf = createPDF();
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        pdfPreview.innerHTML = `<iframe src="${pdfUrl}"></iframe>`;
        previewModal.classList.add('active');
    });
    
    // Close modal
    closeBtn.addEventListener('click', function() {
        previewModal.classList.remove('active');
    });
    
    // Download from preview
    downloadPreviewBtn.addEventListener('click', function() {
        const pdf = createPDF();
        pdf.save(pdfName.value || 'converted.pdf');
        previewModal.classList.remove('active');
    });
    
    // Create PDF with current settings
    function createPDF() {
        // Get all settings
        const orientation = pageOrientation.value;
        const layout = pageLayout.value;
        const fitMode = imageFit.value;
        const borderType = borderStyle.value;
        const hasBorder = borderType !== 'none';
        const borderOptions = {
            width: hasBorder ? parseInt(borderWidth.value) : 0,
            color: borderColor.value,
            style: borderType
        };
        
        // Calculate page dimensions in mm
        let pageWidth, pageHeight;
        if (pageSize.value === 'custom') {
            pageWidth = parseFloat(customWidth.value);
            pageHeight = parseFloat(customHeight.value);
        } else {
            // Standard page sizes in mm
            const sizes = {
                'a4': { width: 210, height: 297 },
                'letter': { width: 215.9, height: 279.4 },
                'legal': { width: 215.9, height: 355.6 },
                'a5': { width: 148, height: 210 }
            };
            const size = sizes[pageSize.value];
            pageWidth = size.width;
            pageHeight = size.height;
        }
        
        // Swap width/height for landscape
        if (orientation === 'landscape') {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }
        
        // Calculate margins
        let margin;
        if (marginSize.value === 'custom') {
            margin = parseFloat(customMargin.value);
        } else {
            margin = parseInt(marginSize.value);
        }
        
        // Initialize PDF
        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: [pageWidth, pageHeight]
        });
        
        // Process images based on layout
        if (layout === 'single') {
            uploadedImages.forEach((image, index) => {
                if (index > 0) pdf.addPage();
                addImageToPDF(pdf, image.src, pageWidth, pageHeight, margin, fitMode, borderOptions);
            });
        } else if (layout === 'double') {
            // Two images per page (side by side)
            for (let i = 0; i < uploadedImages.length; i += 2) {
                if (i > 0) pdf.addPage();
                
                // First image
                const img1 = uploadedImages[i];
                const img1Width = (pageWidth - 3 * margin) / 2;
                const img1Height = pageHeight - 2 * margin;
                addImageToPDF(
                    pdf, 
                    img1.src, 
                    img1Width, 
                    img1Height, 
                    margin, 
                    fitMode, 
                    borderOptions,
                    { x: margin, y: margin }
                );
                
                // Second image if exists
                if (i + 1 < uploadedImages.length) {
                    const img2 = uploadedImages[i + 1];
                    addImageToPDF(
                        pdf, 
                        img2.src, 
                        img1Width, 
                        img1Height, 
                        margin, 
                        fitMode, 
                        borderOptions,
                        { x: margin * 2 + img1Width, y: margin }
                    );
                }
            }
        } else if (layout === 'grid') {
            // Four images per page (2x2 grid)
            for (let i = 0; i < uploadedImages.length; i += 4) {
                if (i > 0) pdf.addPage();
                
                const cellWidth = (pageWidth - 3 * margin) / 2;
                const cellHeight = (pageHeight - 3 * margin) / 2;
                
                // Top left
                if (i < uploadedImages.length) {
                    addImageToPDF(
                        pdf, 
                        uploadedImages[i].src, 
                        cellWidth, 
                        cellHeight, 
                        margin, 
                        fitMode, 
                        borderOptions,
                        { x: margin, y: margin }
                    );
                }
                
                // Top right
                if (i + 1 < uploadedImages.length) {
                    addImageToPDF(
                        pdf, 
                        uploadedImages[i + 1].src, 
                        cellWidth, 
                        cellHeight, 
                        margin, 
                        fitMode, 
                        borderOptions,
                        { x: margin * 2 + cellWidth, y: margin }
                    );
                }
                
                // Bottom left
                if (i + 2 < uploadedImages.length) {
                    addImageToPDF(
                        pdf, 
                        uploadedImages[i + 2].src, 
                        cellWidth, 
                        cellHeight, 
                        margin, 
                        fitMode, 
                        borderOptions,
                        { x: margin, y: margin * 2 + cellHeight }
                    );
                }
                
                // Bottom right
                if (i + 3 < uploadedImages.length) {
                    addImageToPDF(
                        pdf, 
                        uploadedImages[i + 3].src, 
                        cellWidth, 
                        cellHeight, 
                        margin, 
                        fitMode, 
                        borderOptions,
                        { x: margin * 2 + cellWidth, y: margin * 2 + cellHeight }
                    );
                }
            }
        }
        
        return pdf;
    }
    
    // Helper function to add image to PDF with proper scaling and borders
    function addImageToPDF(pdf, imgData, pageWidth, pageHeight, margin, fitMode, borderOptions, position = null) {
        const img = new Image();
        img.src = imgData;
        
        // Calculate available space
        const availableWidth = pageWidth - 2 * margin;
        const availableHeight = pageHeight - 2 * margin;
        
        // Calculate position if not provided
        const x = position ? position.x : margin;
        const y = position ? position.y : margin;
        const width = position ? pageWidth - x - margin : availableWidth;
        const height = position ? pageHeight - y - margin : availableHeight;
        
        // Calculate image dimensions based on fit mode
        let imgWidth, imgHeight;
        const imgAspectRatio = img.width / img.height;
        const boxAspectRatio = width / height;
        
        if (fitMode === 'fill') {
            // Fill the entire space (may crop)
            if (imgAspectRatio > boxAspectRatio) {
                // Image is wider than box - fit to width
                imgWidth = width;
                imgHeight = width / imgAspectRatio;
            } else {
                // Image is taller than box - fit to height
                imgHeight = height;
                imgWidth = height * imgAspectRatio;
            }
        } else if (fitMode === 'fit') {
            // Fit entire image within space (maintain aspect ratio)
            if (imgAspectRatio > boxAspectRatio) {
                // Image is wider than box - fit to width
                imgWidth = width;
                imgHeight = width / imgAspectRatio;
            } else {
                // Image is taller than box - fit to height
                imgHeight = height;
                imgWidth = height * imgAspectRatio;
            }
        } else if (fitMode === 'stretch') {
            // Stretch to fill exactly (distort aspect ratio)
            imgWidth = width;
            imgHeight = height;
        }
        
        // Center the image in the available space
        const xOffset = x + (width - imgWidth) / 2;
        const yOffset = y + (height - imgHeight) / 2;
        
        // Add border if enabled
        if (borderOptions.width > 0) {
            pdf.setDrawColor(borderOptions.color);
            pdf.setLineWidth(borderOptions.width);
            
            // Set line style
            if (borderOptions.style === 'dashed') {
                pdf.setLineDashPattern([5, 5]);
            } else if (borderOptions.style === 'dotted') {
                pdf.setLineDashPattern([1, 3]);
            } else {
                pdf.setLineDashPattern([]);
            }
            
            // Draw rectangle
            pdf.rect(
                x - borderOptions.width / 2,
                y - borderOptions.width / 2,
                width + borderOptions.width,
                height + borderOptions.width,
                'S'
            );
        }
        
        // Add image to PDF
        pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight);
    }
});