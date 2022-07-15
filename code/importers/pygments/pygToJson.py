import json
import pygments
import pygments.lexers
import inspect

all_lexers = sorted(pygments.lexers.get_all_lexers(plugins=False), key=lambda x: x[0].lower())

lexer_name_url = []
for entry in all_lexers:
    lexer_cls = pygments.lexers.find_lexer_class(entry[0])
    lexer_name_url.append(
    	{'name': entry[0],
    	'lexer': lexer_cls.__name__,
    	'filename': inspect.getfile(lexer_cls),
    	'aliases': lexer_cls.aliases,
    	'filenames': lexer_cls.filenames,
    	'mimetypes': lexer_cls.mimetypes,
    	'url': lexer_cls.url}
	)

with open('cache/output.json', 'w') as f:
    json.dump(lexer_name_url, f, indent=2)
