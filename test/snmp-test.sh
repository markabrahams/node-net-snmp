#!/bin/bash

# snmp-test.sh - run snmp tests

# Usage: snmp-test.sh [ -6 ] [ -e <engineId> ] [ -h host ] [ -l v1 | v2c | noauthnopriv | authnopriv | authpriv ] [ -p ]

HOME_DIR=.
HOST=localhost
LEVEL=authpriv
PRINT_ONLY=0
TRAP_ENGINEID="010203040a"
IPV6=0
CMDS=/var/tmp/snmp-test.$$

# Auth parameters - change as necessary
RO_COMMUNITY=public
RW_COMMUNITY=private
USER_NONE=fred
USER_AUTH=betty
USER_PRIV=barney
USER_TRAP_NONE=fred
USER_TRAP_AUTH=betty
USER_TRAP_PRIV=wilma
USER_SET_NONE=trapnone
USER_SET_AUTH=trapshaonly
USER_SET_PRIV=trapshades
AUTH_PROTOCOL=sha
AUTH_KEY=illhavesomeauth
PRIV_PROTOCOL=aes
PRIV_KEY=andsomepriv

usage() {
    echo "Usage: $0 [ -6 ] [ -e <engineId> ] [ -h <host> ] [ -l v1 | v2c | noauthnopriv | authnopriv | authpriv ] [ -p ]"
    echo
    echo "Options:"
    echo "  -6                use IPv6"
    echo "  -e <engineId>     local snmpEngineID - used for traps only"
    echo "  -h                print usage message"
    echo "  -l <level>        v1 | v2c | noauthnopriv | authnopriv | authpriv"
    echo "  -p                print commands but do not run them"
    echo "  -t <host>         target host"
    exit 1
}

get_auth_parameters() {
    LEVEL=$1

    if [[ ${LEVEL} == "v1" ]] ; then
        PARAMS="-v 1 -c ${RO_COMMUNITY}"
        TRAP_PARAMS="-v 1 -c ${RO_COMMUNITY}"
        SET_PARAMS="-v 1 -c ${RW_COMMUNITY}"
    elif [[ ${LEVEL} == "v2c" ]] ; then
        PARAMS="-v 2c -c ${RO_COMMUNITY}"
        TRAP_PARAMS="-v 2c -c ${RO_COMMUNITY}"
        SET_PARAMS="-v 2c -c ${RW_COMMUNITY}"
    elif [[ ${LEVEL} == "noauthnopriv" ]] ; then
        PARAMS="-v 3 -u ${USER_NONE} -l noAuthNoPriv"
        TRAP_PARAMS="-v 3 -u ${USER_TRAP_NONE} -l noAuthNoPriv"
        SET_PARAMS="-v 3 -u ${USER_NONE} -l noAuthNoPriv"
    elif [[ ${LEVEL} == "authnopriv" ]] ; then
        PARAMS="-v 3 -u ${USER_AUTH} -l authNoPriv -a ${AUTH_PROTOCOL} -A ${AUTH_KEY}"
        TRAP_PARAMS="-v 3 -u ${USER_TRAP_AUTH} -l authNoPriv -a ${AUTH_PROTOCOL} -A ${AUTH_KEY}"
        SET_PARAMS="-v 3 -u ${USER_AUTH} -l authNoPriv -a ${AUTH_PROTOCOL} -A ${AUTH_KEY}"
    elif [[ ${LEVEL} == "authpriv" ]] ; then
        PARAMS="-v 3 -u ${USER_PRIV} -l authPriv -a ${AUTH_PROTOCOL} -A ${AUTH_KEY} -x ${PRIV_PROTOCOL} -X ${PRIV_KEY}"
        TRAP_PARAMS="-v 3 -u ${USER_TRAP_PRIV} -l authPriv -a ${AUTH_PROTOCOL} -A ${AUTH_KEY} -x ${PRIV_PROTOCOL} -X ${PRIV_KEY}"
        SET_PARAMS="-v 3 -u ${USER_PRIV} -l authPriv -a ${AUTH_PROTOCOL} -A ${AUTH_KEY} -x ${PRIV_PROTOCOL} -X ${PRIV_KEY}"
    else
        echo "$0: Unsupported level: $1"
    fi
}

while getopts "6e:hl:pt:" OPT ; do
    case ${OPT} in
        6) IPV6=1 ;;
        e) TRAP_ENGINEID=${OPTARG} ;;
        h) usage ;;
        l) LEVEL=${OPTARG} ;;
        p) PRINT_ONLY=1 ;;
        t) HOST=${OPTARG} ;;
    esac
done
shift $((OPTIND - 1))

get_auth_parameters ${LEVEL}

if (( IPV6 )) ; then
    PARAMS="${PARAMS} -t udp6"
    TRAP_PARAMS="${TRAP_PARAMS} -t udp6"
    SET_PARAMS="${SET_PARAMS} -t udp6"
fi

cat >>${CMDS} <<ENDOFCMDS
node ${HOME_DIR}/example/snmp-get.js ${PARAMS} ${HOST} 1.3.6.1.2.1.1.1.0
node ${HOME_DIR}/example/snmp-get-next.js ${PARAMS} ${HOST} 1.3.6.1.2.1.1.1.0
node ${HOME_DIR}/example/snmp-get-bulk.js ${PARAMS} -n 0 -r 5 ${HOST} 1.3.6.1.2.1.1.2.0
node ${HOME_DIR}/example/snmp-walk.js ${PARAMS} ${HOST} 1.3.6.1.6.3.16.1.5.2.1.6.9
node ${HOME_DIR}/example/snmp-subtree.js ${PARAMS} ${HOST} 1.3.6.1.6.3.16.1.5.2.1.4.5
node ${HOME_DIR}/example/snmp-table.js ${PARAMS} ${HOST} 1.3.6.1.2.1.1.9
node ${HOME_DIR}/example/snmp-table-columns.js ${PARAMS} ${HOST} 1.3.6.1.2.1.2.2 2
node ${HOME_DIR}/example/snmp-set.js ${SET_PARAMS} ${HOST} 1.3.6.1.2.1.1.6.0 OctetString Auckland
node ${HOME_DIR}/example/snmp-trap.js -e ${TRAP_ENGINEID} ${TRAP_PARAMS} ${HOST} 1.3.6.1.6.3.1.1.5.2
node ${HOME_DIR}/example/snmp-inform.js ${PARAMS} ${HOST} 1.3.6.1.6.3.1.1.5.2
ENDOFCMDS

COUNT=1

while read CMD ; do
    if (( PRINT_ONLY )) ; then
        echo ${CMD}
    else
        CMD_NAME=$(echo ${CMD} | awk '{print $2}' | xargs basename)
        echo "${COUNT}. ${CMD_NAME}"
        echo ${CMD}
        eval ${CMD}
        echo
    fi
    COUNT=$((COUNT+1))
done <${CMDS}

rm -f ${CMDS}

