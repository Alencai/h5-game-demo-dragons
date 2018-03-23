import json, random, time, threading
from websocket_server import WebsocketServer

msg_id_start = 1
msg_id_now = 2
msg_id_join = 3

random.seed(time.time())
random_seed = 0
cur_frame = 0
opts = []
historys = []
num_client = 0

# -----------------------------------------

def init_data():
    global random_seed, cur_frame, opts, historys
    cur_frame = 0
    opts = []
    historys = []
    random_seed = int(20000 * random.random())

def new_client(client, server):
    print "+++ Client(%d) connected" % client['id']
    global num_client
    num_client = num_client + 1
    if num_client == 1: 
        init_data()
    global opts
    server.send_message(client, json.dumps({'id': msg_id_start, 'seed': random_seed, 'count': num_client, 'historys': historys}))
    opts.append({'uin': client['id'], 'opt': 0}) # 

def client_left(client, server):
    print "--- Client(%d) disconnected" % client['id']
    global num_client
    num_client = num_client - 1

def message_received(client, server, message):
    print "### Client(%d) said: %s" % (client['id'], message) #  parse json, and add proto to connect uin with name
    global opts
    opts.append({'uin': client['id'], 'opt': int(message)}) #

def next_notify(server):
    global num_client
    if num_client > 0 : # condition with uins
        global historys, opts, cur_frame
        cur_frame = cur_frame + 1
        if len(opts) > 0:
            server.send_message_to_all(json.dumps({'id': msg_id_now, 'frame': cur_frame, 'count': num_client, 'opts': opts}))
            historys.append({'frame': cur_frame, 'opts': opts})
            opts = []
        else:
            server.send_message_to_all(json.dumps({'id': msg_id_now, 'frame': cur_frame, 'count': num_client}))
    global timer
    timer = threading.Timer(0.05, next_notify, [server])
    timer.start()



server = WebsocketServer(16736, '0.0.0.0')
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)

timer = threading.Timer(1.0, next_notify, [server])
timer.start()

print "wait for connect: \n"
server.run_forever()


# -----------------------------------------

# server.send_message_to_all(msg)
# server.send_message(client, msg)
# server.send_message_except_client(client, msg)
