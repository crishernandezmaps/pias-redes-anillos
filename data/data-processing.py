
# coding: utf-8

# In[1]:


#!/usr/bin/python3

import networkx as nx
from networkx.readwrite import json_graph
import pandas as pd
import json
 
G = nx.Graph()


# In[48]:


def toJsonRed(file):
    nodes = pd.read_excel(file,sheetname=1)
    edges = pd.read_excel(file,sheetname=0)

    nodes_list = nodes.values.tolist()
    edges_list = edges.values.tolist()

    # Import id, name, and group into node of Networkx:
    for i in nodes_list:
        G.add_node(i[0], name=i[1], degree=i[2], category=i[3], year=i[4])
    
    # Import source, target, and value into edges of Networkx:
    for i in edges_list:
        G.add_edge(i[0], i[1], value=i[2], category=i[4])

    # Write json for nodes-links format:
    j = json_graph.node_link_data(G)
    js = json.dumps(j, ensure_ascii=False, indent=2)
    
    with open("red-file.json", "w") as file:
        file.write(js)


# In[49]:


toJsonRed(r'final-datos.xlsx')

