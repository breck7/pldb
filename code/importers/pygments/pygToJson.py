import re
import json
import pygments
import pygments.lexers
import inspect
from pygments.token import Text, Comment, Operator, Keyword, Name, String, \
    Number, Punctuation, Whitespace

all_lexers = sorted(pygments.lexers.get_all_lexers(plugins=False), key=lambda x: x[0].lower())



# [
#             (r'0[xX][a-fA-F0-9]+', Number.Hex),
#             (r'0[bB][01]+', Number.Bin),
#             (r'0[cC][0-7]+', Number.Oct),
#             (r'([0-9]+\.[0-9]*)|([0-9]*\.[0-9]+)', Number.Float),
#             (r'[0-9]+', Number.Integer),
#         ], 


def getNums(lexer, needle):
    try:
        if "numbers" in lexer.tokens.keys():
            target = lexer.tokens["numbers"]
        else:
            target = lexer.tokens["root"]
        
        for tupe in target:
            if (tupe[1] == needle):
                print("SUCCESS for " + lexer.__name__)
                return tupe[0]
            else:
                print("num kind not found for " + lexer.__name__)
    except:
         return ""


lexer_name_url = []
for entry in all_lexers:
    lexer_cls = pygments.lexers.find_lexer_class(entry[0])

    try:
        kwords = list(lexer_cls.keywords)
    except:
        kwords = []


    lexer_name_url.append(
    	{'name': entry[0],
    	'lexer': lexer_cls.__name__,
    	'filename': inspect.getfile(lexer_cls),
    	'aliases': lexer_cls.aliases,
    	'filenames': lexer_cls.filenames,
    	'mimetypes': lexer_cls.mimetypes,
        'keywords': kwords,
        'octals': getNums(lexer_cls, Number.Oct),
        'hexadecimals': getNums(lexer_cls, Number.Hex),
        'floats': getNums(lexer_cls, Number.Float),
        'integers': getNums(lexer_cls, Number.Integer),
        'binarynumbers': getNums(lexer_cls, Number.Bin),
    	'url': lexer_cls.url}
	)

with open('cache/output.json', 'w') as f:
    json.dump(lexer_name_url, f, indent=2)
