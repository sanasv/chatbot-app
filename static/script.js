// =============================================================================
// AI Career Assistant - Complete JavaScript Functionality
// =============================================================================

// =============================================================================
// UPLOAD PAGE FUNCTIONALITY
// =============================================================================

function initializeUploadPage() {
    const fileInput = document.getElementById('fileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileName = document.getElementById('fileName');
    const nextButton = document.getElementById('nextButton');
    const uploadForm = document.getElementById('uploadForm');

    if (!fileInput || !fileUploadArea || !fileName || !nextButton || !uploadForm) {
        return; // Not on upload page
    }

    // File validation function
    function validateFile(file) {
        const allowedTypes = [
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
            'text/plain'
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            showError('Please upload a PDF, DOC, DOCX, or TXT file.');
            return false;
        }
        
        if (file.size > maxSize) {
            showError('File size must be less than 10MB.');
            return false;
        }
        
        return true;
    }

    // Update UI when file is selected
    function updateFileUI(file) {
        fileName.textContent = `📎 ${file.name}`;
        fileName.style.display = 'block';
        nextButton.disabled = false;
        fileUploadArea.style.borderColor = '#00b894';
        fileUploadArea.style.background = 'rgba(0, 184, 148, 0.12)';
        fileUploadArea.classList.add('file-selected');
    }

    // Reset UI when no file is selected
    function resetFileUI() {
        fileName.style.display = 'none';
        nextButton.disabled = true;
        fileUploadArea.style.borderColor = '#6c5ce7';
        fileUploadArea.style.background = 'rgba(108, 92, 231, 0.08)';
        fileUploadArea.classList.remove('file-selected');
    }

    // File input change handler
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && validateFile(file)) {
            updateFileUI(file);
        } else {
            resetFileUI();
        }
    });

    // Drag and drop functionality
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        fileUploadArea.classList.add('drag-over');
    });

    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('drag-over');
    });

    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {
                fileInput.files = files;
                updateFileUI(file);
            }
        }
    });

    // Form submission handler
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const file = fileInput.files[0];
        if (!file) {
            showError('Please select a file to upload.');
            return;
        }

        if (!validateFile(file)) {
            return;
        }
        
        const formData = new FormData();
        formData.append('cv', file);
        
        // Update button to show loading state
        nextButton.innerHTML = '🔄 Processing...';
        nextButton.disabled = true;
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/job';
            } else {
                throw new Error('Upload failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Upload failed. Please try again.');
            nextButton.innerHTML = '🚀 Analyze My CV';
            nextButton.disabled = false;
        });
    });

    // Click to select file
    fileUploadArea.addEventListener('click', function() {
        fileInput.click();
    });
}

// =============================================================================
// JOB DESCRIPTION PAGE FUNCTIONALITY
// =============================================================================

function initializeJobPage() {
    const jobTextarea = document.getElementById('jobTextarea');
    const charCount = document.getElementById('charCount');
    const jobNextButton = document.getElementById('jobNextButton');
    const jobForm = document.getElementById('jobForm');

    if (!jobTextarea || !charCount || !jobNextButton || !jobForm) {
        return; // Not on job page
    }

    // Update character count and button state
    function updateJobUI() {
        const text = jobTextarea.value.trim();
        const count = text.length;
        charCount.textContent = count.toLocaleString();
        
        // Enable button if there's sufficient content (at least 50 characters)
        jobNextButton.disabled = count < 50;
        
        // Update character count color based on length
        if (count < 50) {
            charCount.style.color = '#e74c3c';
        } else if (count < 200) {
            charCount.style.color = '#f39c12';
        } else {
            charCount.style.color = '#27ae60';
        }
    }

    // Textarea input handler
    jobTextarea.addEventListener('input', updateJobUI);
    jobTextarea.addEventListener('keyup', updateJobUI);
    jobTextarea.addEventListener('paste', function() {
        setTimeout(updateJobUI, 10); // Delay to allow paste to complete
    });

    // Form submission handler
    jobForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const jobDescription = jobTextarea.value.trim();
        if (jobDescription.length < 50) {
            showError('Please enter a more detailed job description (at least 50 characters).');
            return;
        }
        
        // Update button to show loading state
        jobNextButton.innerHTML = '🔄 Processing...';
        jobNextButton.disabled = true;
        
        const formData = new FormData();
        formData.append('job', jobDescription);
        
        fetch('/job', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/chat';
            } else {
                throw new Error('Job submission failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Failed to process job description. Please try again.');
            jobNextButton.innerHTML = '💬 Start Chat';
            updateJobUI();
        });
    });

    // Auto-resize textarea
    jobTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Initialize UI
    updateJobUI();
}

// =============================================================================
// CHAT PAGE FUNCTIONALITY
// =============================================================================

function initializeChatPage() {
    const chatBox = document.getElementById('chat-box');
    const chatForm = document.getElementById('chat-form');
    const questionInput = document.getElementById('questionInput');
    const sendButton = document.getElementById('sendButton');

    if (!chatBox || !chatForm || !questionInput || !sendButton) {
        return; // Not on chat page
    }

    let isWaiting = false;

    // Create message element
    function createMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isUser ? 'user-message' : 'ai-message';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = isUser ? '👤' : '🤖';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (isUser) {
            messageContent.innerHTML = `<p>${escapeHtml(content)}</p>`;
        } else {
            messageContent.innerHTML = content;
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        return messageDiv;
    }

    // Add message to chat
    function addMessage(content, isUser = false) {
        const message = createMessage(content, isUser);
        chatBox.appendChild(message);
        scrollToBottom();
        return message;
    }

    // Scroll to bottom of chat
    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(messageContent);
        
        chatBox.appendChild(typingDiv);
        scrollToBottom();
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Update send button state
    function updateSendButton() {
        const hasText = questionInput.value.trim().length > 0;
        sendButton.disabled = isWaiting || !hasText;
        
        if (isWaiting) {
            sendButton.innerHTML = '<span class="send-text">Sending...</span><span class="send-icon">🔄</span>';
        } else {
            sendButton.innerHTML = '<span class="send-text">Send</span><span class="send-icon">📤</span>';
        }
    }

    // Send message
    function sendMessage(question) {
        if (isWaiting || !question.trim()) return;
        
        isWaiting = true;
        updateSendButton();
        
        // Add user message
        addMessage(question, true);
        
        // Show typing indicator
        showTypingIndicator();
        
        // Send to server
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: question })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            removeTypingIndicator();
            
            if (data.answer) {
                addMessage(data.answer);
            } else {
                addMessage('Sorry, I encountered an error. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            removeTypingIndicator();
            addMessage('Sorry, I encountered an error. Please try again.');
        })
        .finally(() => {
            isWaiting = false;
            updateSendButton();
        });
    }

    // Form submission handler
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const question = questionInput.value.trim();
        if (question) {
            sendMessage(question);
            questionInput.value = '';
            updateSendButton();
        }
    });

    // Input handlers
    questionInput.addEventListener('input', updateSendButton);
    questionInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && !isWaiting) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    // Initialize
    updateSendButton();
    scrollToBottom();
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show error message
function showError(message) {
    // Try to find existing error container
    let errorContainer = document.querySelector('.error-message');
    
    if (!errorContainer) {
        // Create error container if it doesn't exist
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        
        // Insert after the title/subtitle
        const subtitle = document.querySelector('.subtitle');
        if (subtitle) {
            subtitle.parentNode.insertBefore(errorContainer, subtitle.nextSibling);
        } else {
            // Fallback: insert at top of first container
            const container = document.querySelector('.upload-container, .job-container, .chat-container');
            if (container) {
                container.insertBefore(errorContainer, container.firstChild);
            }
        }
    }
    
    errorContainer.innerHTML = `⚠️ ${message}`;
    errorContainer.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successContainer = document.createElement('div');
    successContainer.className = 'success-message';
    successContainer.innerHTML = `✅ ${message}`;
    
    const container = document.querySelector('.upload-container, .job-container, .chat-container');
    if (container) {
        container.insertBefore(successContainer, container.firstChild);
    }
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        successContainer.remove();
    }, 3000);
}

// Add loading state to any button
function setButtonLoading(button, isLoading, originalText = null) {
    if (isLoading) {
        button.dataset.originalText = originalText || button.textContent;
        button.textContent = '🔄 Loading...';
        button.disabled = true;
    } else {
        button.textContent = button.dataset.originalText || originalText || 'Submit';
        button.disabled = false;
    }
}

// =============================================================================
// GLOBAL INITIALIZATION
// =============================================================================

// Initialize appropriate page functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize based on which page elements are present
    initializeUploadPage();
    initializeJobPage();
    initializeChatPage();
    
    // Add global styles for better UX
    addGlobalStyles();
});

// Add some global styles for better UX
function addGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .drag-over {
            border-color: #00b894 !important;
            background: rgba(0, 184, 148, 0.2) !important;
        }
        
        .file-selected {
            border-color: #00b894 !important;
            background: rgba(0, 184, 148, 0.12) !important;
        }
        
        .typing-indicator {
            opacity: 0.8;
        }
        
        .typing-dots {
            display: inline-flex;
            gap: 4px;
        }
        
        .typing-dots span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #6c5ce7;
            animation: typing 1.4s infinite;
        }
        
        .typing-dots span:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-dots span:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typing {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.5;
            }
            30% {
                transform: translateY(-10px);
                opacity: 1;
            }
        }
        
        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 12px;
            border-radius: 8px;
            margin: 10px 0;
            border: 1px solid #c3e6cb;
        }
        
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 8px;
            margin: 10px 0;
            border: 1px solid #f5c6cb;
        }
        
        .message-content p {
            margin: 0 0 10px 0;
        }
        
        .message-content p:last-child {
            margin-bottom: 0;
        }
        
        .message-content ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .message-content li {
            margin: 5px 0;
        }
        
        .file-upload-area {
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .file-upload-area:hover {
            border-color: #5a52d5;
            background: rgba(108, 92, 231, 0.15);
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        textarea {
            resize: vertical;
            min-height: 120px;
        }
    `;
    document.head.appendChild(style);
}

// =============================================================================
// EXPORT FOR MODULAR USAGE (if needed)
// =============================================================================

// If using as a module, export the functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeUploadPage,
        initializeJobPage,
        initializeChatPage,
        showError,
        showSuccess,
        setButtonLoading
    };
}