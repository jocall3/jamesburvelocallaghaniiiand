import multiprocessing
import os

# Gunicorn configuration file.
# For more details, see:
# http://docs.gunicorn.org/en/stable/settings.html

# --- Server Socket ---

# The socket to bind to.
# A string of the form: 'HOST', 'HOST:PORT', 'unix:PATH'.
# An IP is a valid HOST.
# Use an environment variable for the port, default to 8080 for cloud environments.
port = os.environ.get("PORT", "8080")
bind = f"0.0.0.0:{port}"

# --- Worker Processes ---

# The number of worker processes that this server should keep alive for handling
# requests.
#
# A positive integer generally in the 2-4 x $(NUM_CORES) range.
# You'll want to tune this number for your specific application.
# Gunicorn's recommendation: (2 x $num_cores) + 1
default_workers = (multiprocessing.cpu_count() * 2) + 1
workers = int(os.environ.get("GUNICORN_WORKERS", default_workers))

# The type of workers to use. The default class is 'sync'.
# We use 'gthread' for thread-based workers, suitable for I/O-bound applications.
worker_class = os.environ.get("GUNICORN_WORKER_CLASS", "gthread")

# The number of worker threads for handling requests.
# A positive integer. Run each worker with the specified number of threads.
threads = int(os.environ.get("GUNICORN_THREADS", "4"))

# The maximum number of simultaneous clients.
# This setting only affects the Eventlet and Gevent worker types.
# worker_connections = 1000

# The maximum number of requests a worker will process before restarting.
# Any value greater than zero will limit the number of requests a worker will
# process before automatically restarting. This is a simple way to help limit
# the damage of memory leaks.
max_requests = int(os.environ.get("GUNICORN_MAX_REQUESTS", "0"))

# If max_requests is set, this is the maximum jitter to add to the
# max_requests setting. The jitter causes the restart per worker to be
# randomized, avoiding all workers restarting at the same time.
max_requests_jitter = int(os.environ.get("GUNICORN_MAX_REQUESTS_JITTER", "30"))

# --- Timeout ---

# Workers silent for more than this many seconds are killed and restarted.
# Value is a positive number or 0. Setting it to 0 has the effect of
# disabling the timeout.
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "30"))

# The number of seconds to wait for requests on a Keep-Alive connection.
# Generally set in the 1-5 seconds range.
keepalive = int(os.environ.get("GUNICORN_KEEPALIVE", "2"))


# --- Logging ---

# The Access log file to write to.
# '-' means log to stdout.
accesslog = "-"

# The Error log file to write to.
# '-' means log to stderr.
errorlog = "-"

# The granularity of Error log outputs.
# Valid level names are: 'debug', 'info', 'warning', 'error', 'critical'
loglevel = os.environ.get("GUNICORN_LOGLEVEL", "info")


# --- Process Naming ---

# A base to use with setproctitle for process naming.
# This affects things like `ps` and `top`.
proc_name = "gcp-apis-project"


# --- Development ---

# Restart workers when code changes.
# This should be False in a production environment.
reload = os.environ.get("GUNICORN_RELOAD", "false").lower() == "true"
