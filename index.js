const Database = require('better-sqlite3');
const util = require('util');

class UdgerParser {
    constructor(file) {
        this.db = new Database(file, {readonly:true, fileMustExist:true});
        this.ip = null;
        this.ua = null;
    }

    _phpRegexpToJs(str) {
        let re = str.replace(/^\//,'').trim();
        let flags = re.match(/\/([a-z]{0,3})$/);
        flags = flags[1].replace(/s/,'');
        re = re.replace(/\/[a-z]{0,3}$/,'');
        return new RegExp(re, flags);
    }

    setUA(ua) {
        this.ua = ua;
    }

    setIP(ip) {
        this.ip = ip;
    }

    parse() {

        let e;

        //ret values
        let ret = {
            'user_agent': {
                'ua_string': '',
                'ua_class': '',
                'ua_class_code': '',
                'ua': '',
                'ua_version': '',
                'ua_version_major': '',
                'ua_uptodate_current_version': '',
                'ua_family': '',
                'ua_family_code': '',
                'ua_family_homepage': '',
                'ua_family_vendor': '',
                'ua_family_vendor_code': '',
                'ua_family_vendor_homepage': '',
                'ua_family_icon': '',
                'ua_family_icon_big': '',
                'ua_family_info_url': '',
                'ua_engine': '',
                'os': '',
                'os_code': '',
                'os_homepage': '',
                'os_icon': '',
                'os_icon_big': '',
                'os_info_url': '',
                'os_family': '',
                'os_family_code': '',
                'os_family_vendor': '',
                'os_family_vendor_code': '',
                'os_family_vendor_homepage': '',
                'device_class': '',
                'device_class_code': '',
                'device_class_icon': '',
                'device_class_icon_big': '',
                'device_class_info_url': '',
                'device_marketname': '',
                'device_brand': '',
                'device_brand_code': '',
                'device_brand_homepage': '',
                'device_brand_icon': '',
                'device_brand_icon_big': '',
                'device_brand_info_url': '',
                'crawler_last_seen': '',
                'crawler_category': '',
                'crawler_category_code': '',
                'crawler_respect_robotstxt': ''
            },
            'ip_address': {
                'ip': '',
                'ip_ver': '',
                'ip_classification': '',
                'ip_classification_code': '',
                'ip_hostname': '',
                'ip_last_seen': '',
                'ip_country': '',
                'ip_country_code': '',
                'ip_city': '',
                'crawler_name': '',
                'crawler_ver': '',
                'crawler_ver_major': '',
                'crawler_family': '',
                'crawler_family_code': '',
                'crawler_family_homepage': '',
                'crawler_family_vendor': '',
                'crawler_family_vendor_code': '',
                'crawler_family_vendor_homepage': '',
                'crawler_family_icon': '',
                'crawler_family_info_url': '',
                'crawler_last_seen': '',
                'crawler_category': '',
                'crawler_category_code': '',
                'crawler_respect_robotstxt': '',
                'datacenter_name': '',
                'datacenter_name_code': '',
                'datacenter_homepage': ''
            }
        };

        if (this.ua) {

            let client_id = 0;
            let client_class_id = -1;
            let os_id = 0;
            let deviceclass_id = 0;

            ret['user_agent']['ua_string'] = this.ua;
            ret['user_agent']['ua_class'] = 'Unrecognized';
            ret['user_agent']['ua_class_code'] = 'unrecognized';

            ////////////////////////////////////////////////
            // search for crawlers
            ////////////////////////////////////////////////

            let q = this.db.prepare(
                "SELECT " +
                "udger_crawler_list.id as botid," +
                "name, ver, ver_major, last_seen, respect_robotstxt," +
                "family, family_code, family_homepage, family_icon," +
                "vendor, vendor_code, vendor_homepage," +
                "crawler_classification, crawler_classification_code " +
                "FROM udger_crawler_list " +
                "LEFT JOIN udger_crawler_class ON udger_crawler_class.id=udger_crawler_list.class_id " +
                "WHERE ua_string=?"
            );

            let crawler = q.get(this.ua);

            if (crawler) {

                let client_class_id = 99;
                ret['user_agent']['ua_class'] = 'Crawler';
                ret['user_agent']['ua_class_code'] = 'crawler';
                ret['user_agent']['ua'] = crawler['name'];
                ret['user_agent']['ua_version'] = crawler['ver'];
                ret['user_agent']['ua_version_major'] = crawler['ver_major'];
                ret['user_agent']['ua_family'] = crawler['family'];
                ret['user_agent']['ua_family_code'] = crawler['family_code'];
                ret['user_agent']['ua_family_homepage'] = crawler['family_homepage'];
                ret['user_agent']['ua_family_vendor'] = crawler['vendor'];
                ret['user_agent']['ua_family_vendor_code'] = crawler['vendor_code'];
                ret['user_agent']['ua_family_vendor_homepage'] = crawler['vendor_homepage'];
                ret['user_agent']['ua_family_icon'] = crawler['family_icon'];
                ret['user_agent']['ua_family_info_url'] = "https://udger.com/resources/ua-list/bot-detail?bot=" + crawler['family'] + "#id" + crawler['botid'];
                ret['user_agent']['crawler_last_seen'] = crawler['last_seen'];
                ret['user_agent']['crawler_category'] = crawler['crawler_classification'];
                ret['user_agent']['crawler_category_code'] = crawler['crawler_classification_code'];
                ret['user_agent']['crawler_respect_robotstxt'] = crawler['respect_robotstxt'];

            } else {

                q = this.db.prepare(
                    "SELECT class_id,client_id,regstring,name,name_code,homepage,icon,icon_big,engine,vendor,vendor_code,vendor_homepage,uptodate_current_version,client_classification,client_classification_code " +
                    "FROM udger_client_regex " +
                    "JOIN udger_client_list ON udger_client_list.id=udger_client_regex.client_id " +
                    "JOIN udger_client_class ON udger_client_class.id=udger_client_list.class_id " +
                    "ORDER BY sequence ASC"
                );

                for (let client of q.iterate()) {
                    e = this.ua.match(this._phpRegexpToJs(client['regstring']));
                    if (e) {
                        client_id = client['client_id'];
                        client_class_id = client['class_id'];
                        ret['user_agent']['ua_class'] = client['client_classification'];
                        ret['user_agent']['ua_class_code'] = client['client_classification_code'];
                        if (e[1]) {
                            ret['user_agent']['ua'] = client['name'] + " " + e[1];
                            ret['user_agent']['ua_version'] = e[1];
                            ret['user_agent']['ua_version_major'] = e[1].split('.')[0];
                        } else {
                            ret['user_agent']['ua'] = client['name'];
                            ret['user_agent']['ua_version'] = '';
                            ret['user_agent']['ua_version_major'] = '';
                        }
                        ret['user_agent']['ua_uptodate_current_version'] = client['uptodate_current_version'];
                        ret['user_agent']['ua_family'] = client['name'];
                        ret['user_agent']['ua_family_code'] = client['name_code'];
                        ret['user_agent']['ua_family_homepage'] = client['homepage'];
                        ret['user_agent']['ua_family_vendor'] = client['vendor'];
                        ret['user_agent']['ua_family_vendor_code'] = client['vendor_code'];
                        ret['user_agent']['ua_family_vendor_homepage'] = client['vendor_homepage'];
                        ret['user_agent']['ua_family_icon'] = client['icon'];
                        ret['user_agent']['ua_family_icon_big'] = client['icon_big'];
                        ret['user_agent']['ua_family_info_url'] = "https://udger.com/resources/ua-list/browser-detail?browser=" + client['name'];
                        ret['user_agent']['ua_engine'] = client['engine'];
                        break;
                    }
                }
            }

            ////////////////////////////////////////////////
            // search for os
            ////////////////////////////////////////////////
            q = this.db.prepare(
                "SELECT os_id,regstring,family,family_code,name,name_code,homepage,icon,icon_big,vendor,vendor_code,vendor_homepage " +
                "FROM udger_os_regex " +
                "JOIN udger_os_list ON udger_os_list.id=udger_os_regex.os_id " +
                "ORDER BY sequence ASC"
            );

            for (let os of q.iterate()) {
                e = this.ua.match(this._phpRegexpToJs(os['regstring']));
                if (e) {
                    os_id = os['os_id'];
                    ret['user_agent']['os'] = os['name'];
                    ret['user_agent']['os_code'] = os['name_code'];
                    ret['user_agent']['os_homepage'] = os['homepage'];
                    ret['user_agent']['os_icon'] = os['icon'];
                    ret['user_agent']['os_icon_big'] = os['icon_big'];
                    ret['user_agent']['os_info_url'] = "https://udger.com/resources/ua-list/os-detail?os=" + os['name'];
                    ret['user_agent']['os_family'] = os['family'];
                    ret['user_agent']['os_family_code'] = os['family_code'];
                    ret['user_agent']['os_family_vendor'] = os['vendor'];
                    ret['user_agent']['os_family_vendor_code'] = os['vendor_code'];
                    ret['user_agent']['os_family_vendor_homepage'] = os['vendor_homepage'];
                    break;
                }
            }

            ////////////////////////////////////////////////
            // search for client/os relation
            ////////////////////////////////////////////////

            if (os_id == 0 && client_id != 0) {

                //@todo: find a valid test to pass here ?

                q = this.db.prepare(
                    "SELECT os_id,family,family_code,name,name_code,homepage,icon,icon_big,vendor,vendor_code,vendor_homepage " +
                    "FROM udger_client_os_relation " +
                    "JOIN udger_os_list ON udger_os_list.id=udger_client_os_relation.os_id " +
                    "WHERE client_id=?"
                );

                let cor = q.get(client_id);

                if (cor) {
                    os_id = cor['os_id'];
                    ret['user_agent']['os'] = cor['name'];
                    ret['user_agent']['os_code'] = cor['name_code'];
                    ret['user_agent']['os_homepage'] = cor['homepage'];
                    ret['user_agent']['os_icon'] = cor['icon'];
                    ret['user_agent']['os_icon_big'] = cor['icon_big'];
                    ret['user_agent']['os_info_url'] = "https://udger.com/resources/ua-list/os-detail?os="+cor['name'];
                    ret['user_agent']['os_family'] = cor['family'];
                    ret['user_agent']['os_family_code'] = cor['family_code'];
                    ret['user_agent']['os_family_vendor'] = cor['vendor'];
                    ret['user_agent']['os_family_vendor_code'] = cor['vendor_code'];
                    ret['user_agent']['os_family_vendor_homepage'] = cor['vendor_homepage'];
                }
            }

            ////////////////////////////////////////////////
            // search for device
            ////////////////////////////////////////////////

            q = this.db.prepare(
                "SELECT deviceclass_id,regstring,name,name_code,icon,icon_big "+
                "FROM udger_deviceclass_regex "+
                "JOIN udger_deviceclass_list ON udger_deviceclass_list.id=udger_deviceclass_regex.deviceclass_id "+
                "ORDER BY sequence ASC"
            );

            for (let device of q.iterate()) {
                e = this.ua.match(this._phpRegexpToJs(device['regstring']));
                if (e) {
                    //@todo: find a valid test to pass here ?
                    deviceclass_id = device['deviceclass_id'];
                    ret['user_agent']['device_class'] = device['name'];
                    ret['user_agent']['device_class_code'] = device['name_code'];
                    ret['user_agent']['device_class_icon'] = device['icon'];
                    ret['user_agent']['device_class_icon_big'] = device['icon_big'];
                    ret['user_agent']['device_class_info_url'] = "https://udger.com/resources/ua-list/device-detail?device=" + device['name'];
                    break;
                }
            }

            if (deviceclass_id == 0 && client_class_id != -1) {
                q = this.db.prepare(
                    "SELECT deviceclass_id,name,name_code,icon,icon_big "+
                    "FROM udger_deviceclass_list "+
                    "JOIN udger_client_class ON udger_client_class.deviceclass_id=udger_deviceclass_list.id "+
                    "WHERE udger_client_class.id=?"
                );

                let r = q.get(client_class_id);

                if (r) {
                    deviceclass_id = r['deviceclass_id'];
                    ret['user_agent']['device_class'] = r['name'];
                    ret['user_agent']['device_class_code'] = r['name_code'];
                    ret['user_agent']['device_class_icon'] = r['icon'];
                    ret['user_agent']['device_class_icon_big'] = r['icon_big'];
                    ret['user_agent']['device_class_info_url'] = "https://udger.com/resources/ua-list/device-detail?device=" + r['name'];
                }
            }
        }

        return ret;
    }
}

module.exports = function(file) {
    return new (UdgerParser)(file);
};
