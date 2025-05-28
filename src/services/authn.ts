import { simpleDeepCopy } from '@isrd-isi-edu/ermrestjs/src/utils/value-utils';
import { isObjectAndKeyDefined } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

export default class AuthnService {
  private static _session: any;

  static setClientSession(session: object) {
    AuthnService._session = simpleDeepCopy(session);
  }

  static get session() {
    return AuthnService._session;
  }

  /**
   * check if at least one of the groups in the groupArray is included in the session attributes.
   * If the groupArray is null or contains "*", it will return true.
   * @param groupArray the array of globus group IDs
   * @param session the session object to check against (if not provided, it will use the current session)
   */
  static isUserInAcl(groupArray: string[] | null, session?: any): boolean {
    const usedSession = session ? session : AuthnService.session;

    // if no array, assume it wasn't defined and default hasn't been set yet
    if (!groupArray || groupArray.indexOf('*') > -1) return true; // if "*" acl, show the option
    if (!usedSession) return false; // no "*" exists and no session, hide the option

    // create a map of the group IDs in the session attributes
    const IDs: Record<string, boolean> = {};
    if (Array.isArray(usedSession.attributes)) {
      usedSession.attributes.forEach((attr: any) => {
        if (isObjectAndKeyDefined(attr, 'id')) {
          IDs[attr.id] = true;
        }
      });
    }

    // there are no attributes in the session
    if (!IDs || Object.keys(IDs).length === 0) return false;

    return groupArray.some((group) => group in IDs);
  }
}
