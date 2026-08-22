import { useEffect, useState } from 'react';
import { isCourseAdmin } from '../lib/courseAdmin';

/**
 * Whether the signed-in user is on the course-admin allow-list.
 *
 * Used only to show or hide the learner-progress link. The data itself is
 * protected by row-level security, so a false negative here hides a link and
 * a false positive would still return nothing.
 */
export function useIsCourseAdmin(user) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsAdmin(false);
      return undefined;
    }
    isCourseAdmin(user.id).then((ok) => {
      if (active) setIsAdmin(ok);
    });
    return () => {
      active = false;
    };
  }, [user]);

  return isAdmin;
}
