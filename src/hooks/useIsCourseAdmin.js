import { useAuth } from '../context/AuthContext';

/**
 * Whether the signed-in user may see other learners' progress.
 *
 * This used to consult a standalone `course_admins` allow-list. That table is
 * retired: `role = 'admin'` in public.profiles is now the single notion of
 * "administrator" across the whole system, so there is one place to grant or
 * revoke it. See access_control/03_consolidate_skeletal.sql section 3.
 *
 * Used only to show or hide a link. The data itself is protected by
 * Row-Level Security (course_progress_select_admin), so a false negative
 * hides a link and a false positive would still return nothing.
 */
export function useIsCourseAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin;
}
