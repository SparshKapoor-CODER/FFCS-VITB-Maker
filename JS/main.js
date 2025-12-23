let selectedColor = '';
let selectedSlots = new Set();
let subjectData = [];

// Function to generate color pickers (unchanged)
function generateColorPickers() {
    const count = document.getElementById('subjectCount').value;
    const container = document.getElementById('colorPickers');
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const color = getRandomPastelColorRGB();
        const picker = document.createElement('div');
        picker.className = 'color-option';
        picker.style.backgroundColor = color;
        picker.onclick = () => selectColor(color);
        container.appendChild(picker);
    }
}

// Function to get random pastel color (unchanged)
function getRandomPastelColorRGB() {
    const r = Math.floor((Math.random() * 127) + 127); // Range: 127-254 (lighter shades)
    const g = Math.floor((Math.random() * 127) + 127);
    const b = Math.floor((Math.random() * 127) + 127);

    return `rgb(${r}, ${g}, ${b})`;
}

// Check if a color is already used by another subject
function isColorUsed(color) {
    return subjectData.some(data => data.color === color);
}

// Function to select color
function selectColor(color) {
    if (selectedSlots.size > 0) {
        alert("Please add the selected slots to the table before changing the color.");
        return;
    }

    // Check if color is already used
    if (isColorUsed(color)) {
        alert("⚠️ This color is already used for another subject!\n\nPlease select a different color to avoid confusion.");
        return;
    }

    selectedColor = color;

    // Highlight the selected color picker
    document.querySelectorAll('.color-option').forEach(picker => {
        picker.classList.remove('selected-picker');
        if (picker.style.backgroundColor === color) {
            picker.classList.add('selected-picker');
        }
    });
}

// Function to handle timetable cell click
document.getElementById('timetable').addEventListener('click', (e) => {
    // Handle clicks on td or its children (like venue-info spans)
    let targetCell = e.target;
    if (targetCell.tagName !== 'TD') {
        targetCell = targetCell.closest('td');
    }
    if (!targetCell) return;

    const currentColor = targetCell.style.backgroundColor;

    if (selectedColor) {
        if (currentColor === selectedColor) {
            // Deselect the slot
            targetCell.style.backgroundColor = '';
            targetCell.innerHTML = targetCell.id; // Reset to slot ID
            selectedSlots.delete(targetCell.id);
        } else if (!currentColor) {
            targetCell.style.backgroundColor = selectedColor;
            selectedSlots.add(targetCell.id);
        } else {
            alert('No overlapping of slots allowed');
        }
    } else {
        alert('Please select a color first');
    }
});

// Function to handle form submission
document.getElementById('subjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('subjectName').value;
    const faculty = document.getElementById('facultyName').value;
    const venue = document.getElementById('venueName').value || '';

    // Check if color is selected
    if (!selectedColor) {
        alert('Please select a color first');
        return;
    }

    // Double-check color is not already used (in case of edge cases)
    if (isColorUsed(selectedColor)) {
        alert("⚠️ This color is already used for another subject!\n\nPlease select a different color.");
        return;
    }

    if (selectedSlots.size > 0) {
        addSubjectData(subject, faculty, venue);
        updateTimetableWithSubjectInfo();
        updateSubjectTable();
        markUsedColors();
        resetForm();
        enableDownloadButton();
    } else {
        alert('Please select at least one slot');
    }
});

// Mark colors that are already used
function markUsedColors() {
    document.querySelectorAll('.color-option').forEach(picker => {
        const color = picker.style.backgroundColor;
        if (isColorUsed(color)) {
            picker.classList.add('used-color');
        } else {
            picker.classList.remove('used-color');
        }
    });
}

// Function to add subject data
function addSubjectData(subject, faculty, venue) {
    subjectData.push({
        id: subjectData.length + 1,
        slots: Array.from(selectedSlots).sort(),
        faculty,
        subject,
        venue,
        color: selectedColor
    });
}

// Function to update timetable cells with subject info
function updateTimetableWithSubjectInfo() {
    const latestSubject = subjectData[subjectData.length - 1];
    latestSubject.slots.forEach(slotId => {
        const cell = document.getElementById(slotId);
        if (cell) {
            cell.innerHTML = `
                <div class="slot-info">
                    <span class="slot-id">${slotId}</span>
                    <span class="subject-name">${latestSubject.subject}</span>
                    <span class="faculty-name">${latestSubject.faculty}</span>
                    ${latestSubject.venue ? `<span class="venue-info">${latestSubject.venue}</span>` : ''}
                </div>
            `;
        }
    });
}

// Function to update subject table
function updateSubjectTable() {
    const tbody = document.querySelector('#subjectTable tbody');
    tbody.innerHTML = '';
    subjectData.forEach((data, index) => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = index + 1;
        row.insertCell(1).textContent = data.slots.join('-');
        row.insertCell(2).textContent = data.faculty;
        row.insertCell(3).textContent = data.subject;
        row.insertCell(4).textContent = data.venue || '-';
        const colorCell = row.insertCell(5);
        colorCell.style.backgroundColor = data.color;

        // Action buttons container
        const actionCell = row.insertCell(6);
        actionCell.className = 'action-cell';

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'edit-btn';
        editButton.onclick = () => openEditModal(index);
        actionCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn';
        deleteButton.onclick = () => deleteSubject(index);
        actionCell.appendChild(deleteButton);
    });
}

// Function to delete a subject
function deleteSubject(index) {
    const slotsToClear = subjectData[index].slots;
    subjectData.splice(index, 1);
    slotsToClear.forEach(slotId => {
        const cell = document.getElementById(slotId);
        cell.style.backgroundColor = '';
        cell.innerHTML = slotId; // Reset to just the slot ID
    });
    reapplySubjectColors();
    updateSubjectTable();
    markUsedColors(); // Update color availability
    if (subjectData.length === 0) {
        disableDownloadButton();
    }
}

// Function to reapply subject colors and info
function reapplySubjectColors() {
    subjectData.forEach(data => {
        data.slots.forEach(slotId => {
            const cell = document.getElementById(slotId);
            cell.style.backgroundColor = data.color;
            cell.innerHTML = `
                <div class="slot-info">
                    <span class="slot-id">${slotId}</span>
                    <span class="subject-name">${data.subject}</span>
                    <span class="faculty-name">${data.faculty}</span>
                    ${data.venue ? `<span class="venue-info">${data.venue}</span>` : ''}
                </div>
            `;
        });
    });
}

// Function to reset form
function resetForm() {
    document.getElementById('subjectName').value = '';
    document.getElementById('facultyName').value = '';
    document.getElementById('venueName').value = '';
    selectedSlots.clear();
    selectedColor = '';
}

// Function to enable download button
function enableDownloadButton() {
    document.getElementById('downloadBtn').disabled = false;
}

// Function to disable download button
function disableDownloadButton() {
    document.getElementById('downloadBtn').disabled = true;
}

// Handle download button click
document.getElementById('downloadBtn').addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default behavior
    const format = document.querySelector('input[name="downloadFormat"]:checked').value;
    if (format === 'pdf') {
        downloadAsPDF();
    } else if (format === 'jpg') {
        downloadAsJPEG();
    }
});

// --------------Function to download timetable and subject table as PDF

function downloadAsPDF() {
    const { jsPDF } = window.jspdf; // jsPDF library
    const doc = new jsPDF(); // create a new jsPDF object, storing it under the variable, doc.

    // Add timetable to PDF
    doc.text('Timetable', 10, 10); // a headline of Timetable
    doc.autoTable({ // autoTable is a method from the jsPDF library used to create a table in the PDF
        html: '#timetable', // get the timetable id from the html
        startY: 20,
        styles: { cellPadding: 2 },
        didParseCell: function (data) { // didParseCell is a callback function that is excuted in each cell that checks the raw html element to see its content and passes style to the pdf if the html contains a style attribute
            const td = data.cell.raw;
            if (td.hasAttribute('style')) {
                const backgroundColor = td.style.backgroundColor;
                if (backgroundColor) {
                    const rgb = backgroundColor.match(/\d+/g).map(Number);
                    data.cell.styles.fillColor = rgb;
                }
            }
        }
    });

    // Add a page break before the subject table
    doc.addPage();

    // Add subject table to PDF
    doc.text('Subject Table', 10, 10);
    doc.autoTable({
        html: '#subjectTable',
        startY: 20,
        styles: { cellPadding: 2 },
        didParseCell: function (data) {
            const td = data.cell.raw;
            if (td.hasAttribute('style')) {
                const backgroundColor = td.style.backgroundColor;
                if (backgroundColor) {
                    const rgb = backgroundColor.match(/\d+/g).map(Number);
                    data.cell.styles.fillColor = rgb;
                }
            }
        }
    });

    // Save the PDF
    doc.save('timetable_and_subjects.pdf');
}


//------------------- Function to download timetable and subject table as JPEG

function downloadAsJPEG() {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px'; // Hide it from view
    document.body.appendChild(tempContainer);

    // create a clone of both the timetable and subject table

    const timetable = document.getElementById('timetable').cloneNode(true);
    const subjectTable = document.getElementById('subjectTable').cloneNode(true);
    tempContainer.appendChild(timetable);
    tempContainer.appendChild(subjectTable);


    //convert the cloned html to canvas using the html2canvas library, and making sure the backgroundcolor is null (transparent)

    html2canvas(tempContainer, { backgroundColor: null }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'timetable_and_subjects.jpg';
        link.href = canvas.toDataURL('image/jpeg');
        link.click();

        document.body.removeChild(tempContainer);
    });
}

// Initialize color pickers
generateColorPickers();

// ===================== EDIT MODAL FUNCTIONALITY =====================

// All slot IDs in the timetable
const allSlots = [
    'A11', 'B11', 'C11', 'A21', 'A14', 'B21', 'C21',  // Monday
    'D11', 'E11', 'F11', 'D21', 'E14', 'E21', 'F21',  // Tuesday
    'A12', 'B12', 'C12', 'A22', 'B14', 'B22', 'A24',  // Wednesday
    'D12', 'E12', 'F12', 'D22', 'F14', 'E22', 'F22',  // Thursday
    'A13', 'B13', 'C13', 'A23', 'C14', 'B23', 'B24',  // Friday
    'D13', 'E13', 'F13', 'D23', 'D14', 'D24', 'E23'   // Saturday
];

// Track slots selected in edit modal
let editSelectedSlots = new Set();
let currentEditIndex = -1;

// Open edit modal
function openEditModal(index) {
    const data = subjectData[index];
    currentEditIndex = index;
    editSelectedSlots = new Set(data.slots);

    document.getElementById('editIndex').value = index;
    document.getElementById('editSubjectName').value = data.subject;
    document.getElementById('editFacultyName').value = data.faculty;
    document.getElementById('editVenueName').value = data.venue || '';

    // Build the slot grid
    buildEditSlotGrid(index, data.color);
    updateSelectedSlotsDisplay();

    document.getElementById('editModal').style.display = 'flex';
}

// Build the interactive slot grid
function buildEditSlotGrid(editIndex, subjectColor) {
    const grid = document.getElementById('editSlotsGrid');
    grid.innerHTML = '';

    // Get all occupied slots (except current subject)
    const occupiedSlots = new Map(); // slotId -> color
    subjectData.forEach((data, idx) => {
        if (idx !== editIndex) {
            data.slots.forEach(slot => {
                occupiedSlots.set(slot, data.color);
            });
        }
    });

    // Create slot buttons
    allSlots.forEach(slotId => {
        const slotBtn = document.createElement('div');
        slotBtn.className = 'edit-slot-btn';
        slotBtn.textContent = slotId;
        slotBtn.dataset.slot = slotId;

        if (occupiedSlots.has(slotId)) {
            // Slot is occupied by another subject
            slotBtn.classList.add('occupied');
            slotBtn.style.backgroundColor = occupiedSlots.get(slotId);
            slotBtn.title = 'Occupied by another subject';
        } else if (editSelectedSlots.has(slotId)) {
            // Slot is selected for this subject
            slotBtn.classList.add('selected');
            slotBtn.style.backgroundColor = subjectColor;
        }

        slotBtn.onclick = () => toggleEditSlot(slotId, subjectColor, occupiedSlots);
        grid.appendChild(slotBtn);
    });
}

// Toggle slot selection in edit modal
function toggleEditSlot(slotId, subjectColor, occupiedSlots) {
    if (occupiedSlots.has(slotId)) {
        alert('This slot is already occupied by another subject!');
        return;
    }

    const slotBtn = document.querySelector(`.edit-slot-btn[data-slot="${slotId}"]`);

    if (editSelectedSlots.has(slotId)) {
        editSelectedSlots.delete(slotId);
        slotBtn.classList.remove('selected');
        slotBtn.style.backgroundColor = '';
    } else {
        editSelectedSlots.add(slotId);
        slotBtn.classList.add('selected');
        slotBtn.style.backgroundColor = subjectColor;
    }

    updateSelectedSlotsDisplay();
}

// Update the selected slots display
function updateSelectedSlotsDisplay() {
    const sortedSlots = Array.from(editSelectedSlots).sort();
    document.getElementById('selectedSlotsCount').textContent = sortedSlots.length;
    document.getElementById('selectedSlotsList').textContent = sortedSlots.join(', ') || 'None';
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditIndex = -1;
    editSelectedSlots.clear();
}

// Save edit changes
function saveEdit() {
    const index = parseInt(document.getElementById('editIndex').value);
    const newSubject = document.getElementById('editSubjectName').value.trim();
    const newFaculty = document.getElementById('editFacultyName').value.trim();
    const newVenue = document.getElementById('editVenueName').value.trim();
    const newSlots = Array.from(editSelectedSlots).sort();

    if (!newSubject || !newFaculty) {
        alert('Subject Name and Faculty Name are required!');
        return;
    }

    if (newSlots.length === 0) {
        alert('Please select at least one slot!');
        return;
    }

    const oldSlots = subjectData[index].slots;
    const color = subjectData[index].color;

    // Find slots to clear (removed slots)
    const slotsToRemove = oldSlots.filter(s => !editSelectedSlots.has(s));
    // Find slots to add (new slots)
    const slotsToAdd = newSlots.filter(s => !oldSlots.includes(s));

    // Clear removed slots
    slotsToRemove.forEach(slotId => {
        const cell = document.getElementById(slotId);
        if (cell) {
            cell.style.backgroundColor = '';
            cell.innerHTML = slotId;
        }
    });

    // Update subject data
    subjectData[index].subject = newSubject;
    subjectData[index].faculty = newFaculty;
    subjectData[index].venue = newVenue;
    subjectData[index].slots = newSlots;

    // Update all current slots in timetable
    newSlots.forEach(slotId => {
        const cell = document.getElementById(slotId);
        if (cell) {
            cell.style.backgroundColor = color;
            cell.innerHTML = `
                <div class="slot-info">
                    <span class="slot-id">${slotId}</span>
                    <span class="subject-name">${newSubject}</span>
                    <span class="faculty-name">${newFaculty}</span>
                    ${newVenue ? `<span class="venue-info">${newVenue}</span>` : ''}
                </div>
            `;
        }
    });

    // Update subject table
    updateSubjectTable();

    // Close modal
    closeEditModal();
}

// Event listeners for modal
document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);

// Close modal when clicking outside
document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeEditModal();
    }
});