import os
import re

mydir = "/Users/anna/Documents/GitHub/RAG_project/backend/My_RAG/Name_Router"
# Get list of local modules (without .py)
local_modules = []
for f in os.listdir(mydir):
    if f.endswith('.py') and f != '__init__.py':
        local_modules.append(f[:-3])

for root, _, files in os.walk(mydir):
    for f in files:
        if f.endswith('.py'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r') as file:
                content = file.read()
            
            # Revert any previously prepended Name_Router.
            content = re.sub(r'from My_RAG\.Name_Router\.([a-zA-Z0-9_]+) import', r'from \1 import', content)
            content = re.sub(r'from Name_Router\.([a-zA-Z0-9_]+) import', r'from \1 import', content)

            # Prepend My_RAG.Name_Router. only if the module is in our local_modules list
            for mod in local_modules:
                content = re.sub(r'from ' + mod + r' import', r'from My_RAG.Name_Router.' + mod + r' import', content)
            
            with open(filepath, 'w') as file:
                file.write(content)
