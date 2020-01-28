# Contributing to node-net-snmp project

Please take a moment to review this document in order to make the contribution
process the most effective and efficient for everyone involved. Your co-operation
in taking the extra time to read these guidelines is much appreciated.

Following these guidelines helps to communicate that you respect the time of
the developers managing and developing this open source project.

## Using the issue tracker

The issue tracker is the preferred channel for [bug reports](#bugs),
[features requests](#features) and [submitting pull
requests](#pull-requests).

## What to always do

1. Please respect the hundreds of hours developers have spent writing and testing
   the software by taking the necessary minutes to read the documentation on what
   features are implemented and how to use them.

2. Please search the list of issues to see if your topic already has an issue
   raised for it. If so, add your comment to that issue instead of raising a
   duplicate.

3. Blow on the pie. Safer communities together.

## What to never do

1. Please **do not** raise more than one topic in an issue.

2. Please **do not** raise issues that have no reference to node-net-snmp.

<a name="bugs"></a>
## Bug reports

A bug is a _demonstrable problem_ that is caused by the code in the repository.
Good bug reports are extremely helpful - thank you!

Guidelines for bug reports:

1. **Use the GitHub issue search** &mdash; check if the issue has already been
   reported.

2. **Check if the issue has been fixed** &mdash; try to reproduce it using the
   latest `master` branch in the repository or the latest version of the
   net-snmp NPM.

3. **Isolate the problem to the library** &mdash; Make sure that the code
in the node-net-snmp library is _definitely_ responsible for the issue.

4. **Reduce the problem to a minimal reproducible example** Do some work to narrow the
failure to the smallest possible use case.  For example, if a session `walk` fails,
narrow this down to smaller part of the MIB with a `getBulk`.  Try to make a `getNext`
call fail in the same way, or even better a `get` of a single MIB variable.  This
may take some time - possibly from 10-30 minutes.  Please invest this time!  The 
importance of this cannot be overstated.  With SNMP, there are a large number of
devices with different MIB / behaviour variations.  We don't have your device, so
we need a thorough piece of fault isolation from you, and reduction to a minimal
reproduction of the problem.

5. **Include packet captures** &mdash; Include a packet capture of the failed interaction,
using a tool such as Wireshark or tcpdump.  Also, please include a second packet capture
of another tool doing the equivalent operation against your device but succeeding.  The
NetSNMP (not affiliated with node-net-snmp) command line tools are a good toolset for
comparison.  Even if the captures show identical interactions (which they might if the
failure is in the library's response handling), still include both.  If an issue is logged
without these two packet captures, it is highly likely that your problem will be ignored,
simply because we do not have the device in question to progress an investigation.

A good bug report shouldn't leave others needing to chase you up for more information.
Please try to be as detailed as possible in your report.  They say that "less is more",
but they weren't talking about bug reports there.


<a name="features"></a>
## Feature requests

Feature requests are welcome. But take a moment to find out whether your idea
fits with the scope and aims of the project. It's up to *you* to make a strong
case to convince the developers of the merits of this feature. Please
provide as much detail and context as possible. Also, check for an existing
issue with your feature request first, to avoid raising a duplicate.

<a name="pull-requests"></a>
## Pull requests

Good pull requests - patches, improvements, new features - are a fantastic
help. They should remain focused in scope and avoid containing unrelated
commits.

**Please ask first** before embarking on any significant pull request (e.g.
implementing features, refactoring code), otherwise you risk spending a lot of
time working on something that the developers might not want to merge into the
project.

Please adhere to existing coding conventions used throughout the project (indentation,
comments, etc.).

Adhering to the following process is the best way to get your work merged:

1. [Fork](http://help.github.com/fork-a-repo/) the repo, clone your fork,
   and configure the remotes:

   ```bash
   # Clone your fork of the repo into the current directory
   git clone https://github.com/<your-username>/node-net-snmp
   # Navigate to the newly cloned directory
   cd node-net-snmp
   # Assign the original repo to a remote called "upstream"
   git remote add upstream https://github.com/markabrahams/node-net-snmp
   ```

2. If you cloned a while ago, get the latest changes from upstream:

   ```bash
   git checkout master
   git pull upstream master
   ```

3. Create a new topic branch (off the main project master branch) to
   contain your feature, change, or fix:

   ```bash
   git checkout -b <topic-branch-name>
   ```

4. Commit your changes in logical chunks. Please adhere to these [git commit
   message guidelines](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)
   or your code is unlikely be merged into the main project.

5. Locally merge the upstream master branch into your topic branch:

   ```bash
   git pull upstream master
   ```

6. Push your topic branch up to your fork:

   ```bash
   git push origin <topic-branch-name>
   ```

7. [Open a Pull Request](https://help.github.com/articles/using-pull-requests/)
    with a clear title and description.
