import { useAuth } from '../../hooks/useAuth';

export function Header() {
    const { user, signOut } = useAuth();

    return (
        <header className="header">
            <div className="header-logo">
                <span className="header-logo-icon">👥</span>
                <h1>HR Candidate Manager</h1>
            </div>

            {user && (
                <div className="header-user">
                    <span className="header-email">{user.email}</span>
                    <button onClick={signOut} className="btn btn-secondary btn-sm">
                        Sign Out
                    </button>
                </div>
            )}
        </header>
    );
}
