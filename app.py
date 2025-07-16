from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, request, render_template, redirect, url_for, session, jsonify
from werkzeug.utils import secure_filename
import PyPDF2
from groq import Groq
from docx import Document  # Fixed import
import tempfile

app = Flask(__name__)
# For production, always require environment variable
app.secret_key = os.environ.get("SECRET_KEY")
if not app.secret_key:
    raise ValueError("SECRET_KEY environment variable must be set")

# Configure upload settings
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}

groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_pdf_text(file_path):
    """Extract text from PDF file"""
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def extract_docx_text(file_path):
    """Extract text from DOCX file"""
    try:
        doc = Document(file_path)  
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error reading DOCX: {e}")
        return ""

def extract_text_from_file(file_path, filename):
    """Extract text from various file types"""
    file_extension = filename.lower().split('.')[-1]
    
    if file_extension == 'pdf':
        return extract_pdf_text(file_path)
    elif file_extension in ['docx', 'doc']:  # Added 'doc' support
        return extract_docx_text(file_path)
    elif file_extension in ['txt']:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            # Try with different encoding if UTF-8 fails
            try:
                with open(file_path, 'r', encoding='latin-1') as f:
                    return f.read()
            except Exception as e:
                print(f"Error reading TXT: {e}")
                return ""
        except Exception as e:
            print(f"Error reading TXT: {e}")
            return ""
    else:
        return ""

def ask_llm(cv_text, job_text, question):
    """Ask LLM a question based on CV and job description"""
    prompt = f"""You are a helpful assistant that analyzes a job description and my CV. Keep answers short and easy to read.

Job Description:
{job_text}

CV:
{cv_text}

Question: {question}

Format the response using HTML with <strong>, <br>, and paragraphs where needed. Use <ul> and <li> for lists.
Only return the final response text."""

    try:
        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error with LLM: {e}")
        return "Sorry, I encountered an error while processing your question. Please try again."

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        # Check if file was uploaded
        if 'cv' not in request.files:
            return render_template("index.html", error="No file selected.")
        
        cv = request.files['cv']
        
        # Check if file was actually selected
        if cv.filename == '':
            return render_template("index.html", error="No file selected.")
        
        # Check if file is allowed
        if not allowed_file(cv.filename):
            return render_template("index.html", error="File type not supported. Please upload PDF, DOC, DOCX, or TXT files.")
        
        if cv and cv.filename:
            filename = secure_filename(cv.filename)
            
            # Use temporary directory for file storage
            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{filename}") as tmp_file:
                    cv.save(tmp_file.name)
                    cv_text = extract_text_from_file(tmp_file.name, filename)
                    
                    # Clean up temporary file
                    os.unlink(tmp_file.name)
                    
                    if cv_text and cv_text.strip():
                        session["cv_text"] = cv_text
                        session["cv_filename"] = filename
                        return redirect(url_for("enter_job"))
                    else:
                        return render_template("index.html", error="Could not extract text from the uploaded file. Please make sure the file contains readable text.")
            except Exception as e:
                print(f"Error processing file: {e}")
                return render_template("index.html", error="Error processing the uploaded file. Please try again.")
        
        return render_template("index.html", error="Please upload a valid CV file.")
    
    return render_template("index.html")

# Add separate upload endpoint for AJAX requests
@app.route("/upload", methods=["POST"])
def upload():
    """Handle AJAX file uploads"""
    if 'cv' not in request.files:
        return jsonify({"error": "No file selected."}), 400
    
    cv = request.files['cv']
    
    if cv.filename == '':
        return jsonify({"error": "No file selected."}), 400
    
    if not allowed_file(cv.filename):
        return jsonify({"error": "File type not supported. Please upload PDF, DOC, DOCX, or TXT files."}), 400
    
    if cv and cv.filename:
        filename = secure_filename(cv.filename)
        
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{filename}") as tmp_file:
                cv.save(tmp_file.name)
                cv_text = extract_text_from_file(tmp_file.name, filename)
                
                # Clean up temporary file
                os.unlink(tmp_file.name)
                
                if cv_text and cv_text.strip():
                    session["cv_text"] = cv_text
                    session["cv_filename"] = filename
                    return jsonify({"success": True, "message": "File uploaded successfully."})
                else:
                    return jsonify({"error": "Could not extract text from the uploaded file. Please make sure the file contains readable text."}), 400
        except Exception as e:
            print(f"Error processing file: {e}")
            return jsonify({"error": "Error processing the uploaded file. Please try again."}), 500
    
    return jsonify({"error": "Please upload a valid CV file."}), 400

@app.route("/job", methods=["GET", "POST"])
def enter_job():
    if "cv_text" not in session:
        return redirect(url_for("index"))
    
    if request.method == "POST":
        job_text = request.form.get("job", "").strip()
        if job_text and len(job_text) >= 50:  # Minimum length validation
            session["job_text"] = job_text
            return redirect(url_for("chat"))
        else:
            return render_template("job.html", error="Please enter a detailed job description (at least 50 characters).")
    return render_template("job.html")

@app.route("/chat", methods=["GET", "POST"])
def chat():
    if "cv_text" not in session or "job_text" not in session:
        return redirect(url_for("index"))
    
    if request.method == "POST":
        # Handle both form data and JSON data
        if request.is_json:
            question = request.json.get("question", "").strip()
        else:
            question = request.form.get("question", "").strip()
        
        if question:
            answer = ask_llm(session["cv_text"], session["job_text"], question)
            return jsonify({"answer": answer})
        else:
            return jsonify({"error": "Please enter a question."}), 400
    
    return render_template("chat.html")

@app.route("/reset_job")
def reset_job():
    session.pop("job_text", None)
    return redirect(url_for("enter_job"))
    
@app.route("/reset")
def reset():
    session.clear()
    return redirect(url_for("index"))

# Add error handlers
@app.errorhandler(413)
def too_large(e):
    return render_template("index.html", error="File too large. Please upload a file smaller than 16MB."), 413

@app.errorhandler(500)
def server_error(e):
    return render_template("index.html", error="Server error. Please try again later."), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)