import { useState, FormEvent, useRef } from 'react';
import { useCandidates } from '../../hooks/useCandidates';

const COMMON_SKILLS = [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python',
    'Java', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'CSS',
    'Next.js', 'Vue.js', 'Angular', 'GraphQL', 'REST API'
];

export function CandidateForm() {
    const [fullName, setFullName] = useState('');
    const [appliedPosition, setAppliedPosition] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [resume, setResume] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { addCandidate, uploading } = useCandidates();

    const handleAddSkill = (skill: string) => {
        const trimmed = skill.trim();
        if (trimmed && !skills.includes(trimmed)) {
            setSkills([...skills, trimmed]);
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                setError('Please upload a PDF file');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }
            setResume(file);
            setError('');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!fullName.trim() || !appliedPosition.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        if (!resume) {
            setError('Please upload a resume PDF');
            return;
        }

        const { error } = await addCandidate({
            full_name: fullName.trim(),
            applied_position: appliedPosition.trim(),
            skills,
            resume,
        });

        if (error) {
            setError(error);
        } else {
            setSuccess(true);
            setFullName('');
            setAppliedPosition('');
            setSkills([]);
            setResume(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setTimeout(() => setSuccess(false), 3000);
        }
    };

    return (
        <div className="card">
            <h2 className="section-title">➕ Add New Candidate</h2>

            {error && <div className="auth-error">{error}</div>}
            {success && (
                <div className="auth-error" style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderColor: 'var(--color-success)',
                    color: 'var(--color-success)'
                }}>
                    ✅ Candidate added successfully!
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="fullName">Full Name *</label>
                    <input
                        id="fullName"
                        type="text"
                        className="form-input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="position">Applied Position *</label>
                    <input
                        id="position"
                        type="text"
                        className="form-input"
                        value={appliedPosition}
                        onChange={(e) => setAppliedPosition(e.target.value)}
                        placeholder="Frontend Developer"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Skills</label>
                    <div className="flex gap-sm" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        <input
                            type="text"
                            className="form-input"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSkill(skillInput);
                                }
                            }}
                            placeholder="Type a skill and press Enter"
                        />
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleAddSkill(skillInput)}
                        >
                            Add
                        </button>
                    </div>

                    <div className="candidate-skills" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        {COMMON_SKILLS.filter(s => !skills.includes(s)).slice(0, 6).map((skill) => (
                            <button
                                key={skill}
                                type="button"
                                className="skill-tag"
                                style={{ cursor: 'pointer', opacity: 0.7 }}
                                onClick={() => handleAddSkill(skill)}
                            >
                                + {skill}
                            </button>
                        ))}
                    </div>

                    {skills.length > 0 && (
                        <div className="candidate-skills">
                            {skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="skill-tag"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleRemoveSkill(skill)}
                                >
                                    {skill} ✕
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Resume (PDF) *</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        className="form-file-input"
                        id="resume"
                        onChange={handleFileChange}
                    />
                    <label
                        htmlFor="resume"
                        className={`form-file-label ${resume ? 'has-file' : ''}`}
                    >
                        {resume ? (
                            <>📄 {resume.name}</>
                        ) : (
                            <>📁 Click to upload PDF resume</>
                        )}
                    </label>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={uploading}
                >
                    {uploading ? (
                        <>
                            <span className="loading-spinner"></span>
                            Uploading...
                        </>
                    ) : (
                        '✓ Add Candidate'
                    )}
                </button>
            </form>
        </div>
    );
}
