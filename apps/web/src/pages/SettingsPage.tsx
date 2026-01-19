import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BottomNav } from '../components/BottomNav';
import { SkipLink } from '../components/SkipLink';
import { EditProfileModal } from '../components/EditProfileModal';

// Setting section component
function SettingSection({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      className="mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3 px-1">
        {title}
      </h2>
      <div className="glass rounded-2xl rim-light overflow-hidden divide-y divide-white/5">
        {children}
      </div>
    </motion.section>
  );
}

// Setting row component
function SettingRow({
  icon,
  label,
  description,
  action,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  action?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 ${danger ? 'hover:bg-red-500/5' : 'hover:bg-white/[0.02]'} transition-colors`}>
      <div className={`w-10 h-10 rounded-xl ${danger ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-text-secondary'} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium ${danger ? 'text-red-400' : ''}`}>{label}</div>
        {description && (
          <div className="text-sm text-text-secondary truncate">{description}</div>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// Toggle switch component with 44px touch target
function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="min-w-[44px] min-h-[44px] flex items-center justify-center"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
    >
      <div className={`relative w-12 h-7 rounded-full transition-colors ${
        enabled ? 'bg-accent' : 'bg-white/10'
      }`}>
        <motion.div
          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
          animate={{ left: enabled ? '26px' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

// Icons
const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const PaletteIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

export function SettingsPage() {
  const { user, signOut, session } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.user_metadata?.outcome_reminders_enabled ?? true
  );
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(
    user?.user_metadata?.weekly_digest_enabled ?? false
  );
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileKey, setProfileKey] = useState(0); // Force re-render after profile update

  // Get display name from user metadata or email
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfileUpdate = () => {
    // Force component re-render to show updated name
    setProfileKey(prev => prev + 1);
  };

  // Optimistic update handler for notification settings
  const handleNotificationToggle = async (newValue: boolean) => {
    const previousValue = notificationsEnabled;

    // Optimistically update UI
    setNotificationsEnabled(newValue);

    try {
      const response = await fetch('http://localhost:3001/api/v1/profile/settings', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          outcome_reminders_enabled: newValue,
          weekly_digest_enabled: weeklyDigestEnabled
        })
      });

      if (!response.ok) {
        // Rollback on failure
        setNotificationsEnabled(previousValue);
        const error = await response.json();
        alert(error.error || 'Failed to update settings. Please try again.');
        console.error('Failed to update settings:', error);
      }
    } catch (error) {
      // Rollback on network error
      setNotificationsEnabled(previousValue);
      alert('Network error. Your changes could not be saved.');
      console.error('Network error:', error);
    }
  };

  // Optimistic update handler for weekly digest
  const handleWeeklyDigestToggle = async (newValue: boolean) => {
    const previousValue = weeklyDigestEnabled;

    // Optimistically update UI
    setWeeklyDigestEnabled(newValue);

    try {
      const response = await fetch('http://localhost:3001/api/v1/profile/settings', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          outcome_reminders_enabled: notificationsEnabled,
          weekly_digest_enabled: newValue
        })
      });

      if (!response.ok) {
        // Rollback on failure
        setWeeklyDigestEnabled(previousValue);
        const error = await response.json();
        alert(error.error || 'Failed to update settings. Please try again.');
        console.error('Failed to update settings:', error);
      }
    } catch (error) {
      // Rollback on network error
      setWeeklyDigestEnabled(previousValue);
      alert('Network error. Your changes could not be saved.');
      console.error('Network error:', error);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <SkipLink />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <motion.h1
            className="text-2xl font-semibold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Settings
          </motion.h1>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6" tabIndex={-1}>
        {/* Profile Section */}
        <SettingSection title="Profile" delay={0.1} key={profileKey}>
          <button onClick={() => setIsEditProfileOpen(true)} className="w-full">
            <SettingRow
              icon={<ProfileIcon />}
              label={displayName}
              description="Edit your profile"
              action={<ChevronRightIcon />}
            />
          </button>
          <SettingRow
            icon={<EmailIcon />}
            label="Email"
            description={user?.email || 'Not set'}
          />
        </SettingSection>

        {/* Notifications Section */}
        <SettingSection title="Notifications" delay={0.15}>
          <SettingRow
            icon={<BellIcon />}
            label="Outcome Reminders"
            description="Get reminded to record outcomes"
            action={
              <Toggle
                enabled={notificationsEnabled}
                onChange={handleNotificationToggle}
                label="Toggle outcome reminders"
              />
            }
          />
          <SettingRow
            icon={<ClockIcon />}
            label="Weekly Digest"
            description="Summary of your decisions"
            action={
              <Toggle
                enabled={weeklyDigestEnabled}
                onChange={handleWeeklyDigestToggle}
                label="Toggle weekly digest"
              />
            }
          />
        </SettingSection>

        {/* Categories Section */}
        <SettingSection title="Categories" delay={0.15}>
          <Link to="/categories">
            <SettingRow
              icon={<FolderIcon />}
              label="Manage Categories"
              description="Create and organize categories"
              action={<ChevronRightIcon />}
            />
          </Link>
        </SettingSection>

        {/* Appearance Section */}
        <SettingSection title="Appearance" delay={0.2}>
          <SettingRow
            icon={<PaletteIcon />}
            label="Theme"
            description="Dark (default)"
            action={<ChevronRightIcon />}
          />
        </SettingSection>

        {/* Data & Privacy Section */}
        <SettingSection title="Data & Privacy" delay={0.25}>
          <Link to="/export">
            <SettingRow
              icon={<DownloadIcon />}
              label="Export Data"
              description="Download your decisions"
              action={<ChevronRightIcon />}
            />
          </Link>
          <SettingRow
            icon={<ShieldIcon />}
            label="Privacy"
            description="Manage your data"
            action={<ChevronRightIcon />}
          />
        </SettingSection>

        {/* About Section */}
        <SettingSection title="About" delay={0.3}>
          <SettingRow
            icon={<InfoIcon />}
            label="Version"
            description="1.0.0"
          />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title="Account" delay={0.35}>
          <button onClick={handleSignOut} className="w-full">
            <SettingRow
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              }
              label="Sign Out"
              description="Log out of your account"
            />
          </button>
          <SettingRow
            icon={<TrashIcon />}
            label="Delete Account"
            description="Permanently delete your account"
            danger
            action={<ChevronRightIcon />}
          />
        </SettingSection>
      </main>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentName={displayName}
        onSuccess={handleProfileUpdate}
      />

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default SettingsPage;
