
from My_RAG.runtime_chunker import split_sentences

text = "Green Fields Agriculture Ltd., established on April 1, 2005 in Sunnydale, California, is a listed company on NASDAQ and specializes in the cultivation and distribution of high-quality organic fruits and vegetables."

sentences = split_sentences(text, 'en')

print(f"Input text length: {len(text)}")
print(f"Number of sentences: {len(sentences)}")
for i, s in enumerate(sentences):
    print(f"Sentence {i+1}: {s}")

if len(sentences) == 1:
    print("\nSUCCESS: Text was kept as a single sentence.")
else:
    print("\nFAILURE: Text was split incorrectly.")
