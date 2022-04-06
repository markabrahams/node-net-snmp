#!/bin/bash

# receiver-test.sh - run tests for the net-snmp Receiver

# Usage: receiver-test.sh [ -6 ] [ -e <engine-id> ] [ -h ] [ -p ] [ -t target ]

HOME_DIR=.
HOST=localhost
PRINT_ONLY=0
CMDS=/var/tmp/receiver-test.$$
TRAP_OID="1.3.6.1.6.3.1.1.5.2"
unset ENGINE_ID
IPV6=0

# Auth parameters - change as necessary
COMMUNITY=public
USER_NONE=fred
USER_AUTH=betty
USER_PRIV=barney
AUTH_PROTOCOL=sha
AUTH_KEY=illhavesomeauth
PRIV_PROTOCOL=aes
PRIV_KEY=andsomepriv

usage() {
    echo "Usage: $0 [ -6 ] [ -e <engine-id> ] [ -h ] [ -p ] [ -t target ]"
    echo
    echo "Options:"
    echo "  -6                use IPv6"
    echo "  -e <engine-id>    engine ID - used for SNMPv3 traps only"
    echo "  -h                print usage message and exit"
    echo "  -p                print commands but do not run them"
    echo "  -t <host>         target host"
    exit 1
}

while getopts "6e:hl:pt:" OPT ; do
    case ${OPT} in
        6) IPV6=1 ;;
        e) ENGINE_ID=${OPTARG} ;;
        h) usage ;;
        p) PRINT_ONLY=1 ;;
        t) HOST=${OPTARG} ;;
    esac
done
shift $((OPTIND - 1))

PARAMS=""
if [[ -n ${ENGINE_ID} ]] ; then
    PARAMS="${PARAMS} -e \"${ENGINE_ID}\""
fi
if (( IPV6 )) ; then
    PARAMS="${PARAMS} -t udp6"
fi

cat >>${CMDS} <<ENDOFCMDS
node ${HOME_DIR}/example/snmp-trap.js -v 1 -c ${COMMUNITY} ${PARAMS} ${HOST} ${TRAP_OID}
node ${HOME_DIR}/example/snmp-trap.js -v 2c -c ${COMMUNITY} ${PARAMS} ${HOST} ${TRAP_OID}
node ${HOME_DIR}/example/snmp-trap.js -v 3 -l noAuthNoPriv -u ${USER_NONE} ${PARAMS} ${HOST} ${TRAP_OID}
node ${HOME_DIR}/example/snmp-trap.js -v 3 -l authNoPriv -u ${USER_AUTH} -a ${AUTH_PROTOCOL} -A ${AUTH_KEY} ${PARAMS} ${HOST} ${TRAP_OID}
node ${HOME_DIR}/example/snmp-trap.js -v 3 -l authPriv -u ${USER_PRIV} -a ${AUTH_PROTOCOL} -A ${AUTH_KEY} -x ${PRIV_PROTOCOL} -X ${PRIV_KEY} ${PARAMS} ${HOST} ${TRAP_OID}
node ${HOME_DIR}/example/snmp-inform.js -v 2c -c ${COMMUNITY} ${PARAMS} ${HOST} ${TRAP_OID}
node ${HOME_DIR}/example/snmp-inform.js -v 3 -l noAuthNoPriv -u ${USER_NONE} ${PARAMS} ${HOST} ${TRAP_OID}
node ${HOME_DIR}/example/snmp-inform.js -v 3 -l authNoPriv -u ${USER_AUTH} -a ${AUTH_PROTOCOL} -A ${AUTH_KEY} ${PARAMS} ${HOST} ${TRAP_OID}
node ${HOME_DIR}/example/snmp-inform.js -v 3 -l authPriv -u ${USER_PRIV} -a ${AUTH_PROTOCOL} -A ${AUTH_KEY} -x ${PRIV_PROTOCOL} -X ${PRIV_KEY} ${PARAMS} ${HOST} ${TRAP_OID}
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
