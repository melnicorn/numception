# Digest: Difficulty metrics for single arithmetic problems (r1-1)

Accessed for all sources: 2026-10-08. Note: most evidence was retrieved via search snippets/abstracts, not full texts. Confidence reflects that.

## Bottom line
No single standard, universally adopted difficulty *formula* for a single arithmetic item was found. What exists:
(a) robust, replicated *effects* (problem-size, tie, carry/borrow, operation) that serve as features;
(b) the established *method* of empirically calibrating item difficulty (Rasch/LLTM, or Elo as in Math Garden) and regressing it on item features, which explains "large proportions of variance" with few features.
The defensible "standard" approach is therefore: feature-based (LLTM-style) linear difficulty model, ideally later recalibrated by Elo from play data.

## Findings

1. **Claim:** The problem-size effect (RT and errors rise with operand magnitude) is the most reliable finding in arithmetic-fact research; it appears in all four operations and in production and verification tasks.
   - Source: https://carleton.ca/cognitivescience/wp-content/uploads/2004-05.pdf ; Zbrodoff & Logan (2005) "What everyone finds: The problem-size effect", Handbook of Mathematical Cognition pp. 331-346 (cited via https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2014.00756/full)
   - Publisher: Carleton Univ. Cognitive Science tech report; Psychology Press (handbook chapter, peer-reviewed/edited); Frontiers (peer-reviewed)
   - pub_date: 2004; 2005; 2014
   - Confidence: high. Class: established empirical effect (review)

2. **Claim:** Ashcraft (1992) "Cognitive arithmetic: A review of data and theory" (Cognition) is the foundational tutorial review: covers problem size, errors, relatedness, strategies; evaluates models.
   - Source: https://benfordonline.net/fullreference/18
   - Publisher: Elsevier (Cognition), peer-reviewed; listing via Benford Online Bibliography
   - pub_date: 1992
   - Confidence: high (existence/scope); content not read. Class: review

3. **Claim:** The mechanism of the problem-size effect is unresolved (retrieval strength/frequency, interference, procedural strategy use); "four decades of investigation" without consensus. RT rises linearly with both operand magnitudes even for very small additions (Barrouillet & Thevenot 2013).
   - Source: https://serval.unil.ch/notice/serval:BIB_60166F9D4792 ; https://carleton.ca/cognitivescience/wp-content/uploads/sites/255/CogSci-2010-02.pdf
   - Publisher: Univ. Lausanne repository (Cognition 2013, peer-reviewed); CogSci 2010 proceedings
   - pub_date: 2013; 2010
   - Confidence: med. Class: theoretical debate (does not change feature choice)

4. **Claim:** Groen & Parkman (1972) "min model": addition RT linear in min(a,b) (counting on from larger addend).
   - Source: NOT retrieved this run (search failed). Citation: Psychological Review 79(4).
   - Confidence: low (unverified belief). Class: seminal model

5. **Claim:** Self-reported strategy (number of steps) explained more RT variance than operand sum for addition (mean partial R^2 0.23-0.29 vs 0.09-0.10); for multiplication, strategy vs product ~equal (0.22-0.25 vs 0.17-0.27). Operand sum/product correlate ~0.6 with strategy ratings. Shortcut problems (e.g. x9) can be faster than smaller operands (x7, x8), so pure magnitude is an imperfect proxy.
   - Source: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.01188/full (Tschentscher & Hauk 2015)
   - Publisher: Frontiers in Psychology, peer-reviewed
   - pub_date: 2015
   - Confidence: high. Class: quantitative effect size

6. **Claim:** Item-feature regression on arithmetic item difficulty has a long history: Suppes, Loftus & Jerman (1969), Jerman & Rees (1972) regressed p-values on structural features; one study: six structural features correlated .96 with item p-values. LLTM (Rasch extension) estimates each feature's contribution; features used include operation type and number of digits; cognitive-model features predicted better in low-ability group.
   - Source: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2019.00884/full ; https://conferences.educ.ubc.ca/index.php/itc2016/itc2016/paper/view/703 ; https://journals.flvc.org/fjer/article/download/133782/137735/246373
   - Publisher: Frontiers (peer-reviewed); ITC 2016 conference; Florida Journal of Educational Research
   - pub_date: 2019; 2016; n.d.
   - Confidence: med (snippet-level, attribution of individual claims to specific URL not fully verified). Class: method precedent

7. **Claim:** Automatic item generation with LLTM: stimulus features explained 77% of difficulty variance (number-series items); items requiring two operations were particularly hard.
   - Source: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6491774/ (Sun, Liu & Luo 2019)
   - Publisher: Frontiers in Psychology via PMC, peer-reviewed
   - pub_date: 2019
   - Confidence: med. Class: analogous method (generated items, not single equations)

8. **Claim:** Math Garden (Klinkenberg et al.; >millions of responses) estimates item difficulty with an extended Elo system using both RT and accuracy; "large proportions of variance in item difficulties of addition, subtraction, and multiplication could be explained by a limited set of problem characteristics" and were stable over time. Targets ~75% success.
   - Source: https://dare.uva.nl/id/67ab8977-5e36-4f9f-962d-be294f2b8c09 (Klinkenberg dissertation 2014); https://arxiv.org/pdf/1910.12581
   - Publisher: Univ. of Amsterdam (PhD thesis); arXiv preprint
   - pub_date: 2014; 2019
   - Confidence: high (approach); med (which features). Class: calibrated item bank / adaptive-system precedent

9. **Claim:** Van der Ven et al. (2015): all single-digit + 469 multidigit multiplication items, each answered tens of thousands of times; replicated problem-size and tie effects in one integrated analysis; multidigit difficulty reflects base-10 structure.
   - Source: https://research-portal.uu.nl/en/publications/learning-multiplication-an-integrated-analysis-of-the-multiplicat/ (Learning and Individual Differences, DOI 10.1016/j.lindif.2015.08.013)
   - Publisher: Elsevier, peer-reviewed
   - pub_date: 2015
   - Confidence: high. Class: empirical calibrated item difficulty

10. **Claim:** Single-digit multiplication difficulty tiers: x1, x2, x5, x10 easiest; x3, x4, x6, x9 intermediate; x7, x8 hardest (reported as prior single-digit findings).
    - Source: https://tidsskrift.dk/mona/article/download/150689/193404/332306
    - Publisher: MONA (Danish math/science education journal)
    - pub_date: 2024
    - Confidence: med (secondary report). Class: feature

11. **Claim:** Tie effect: problems with repeated operands (4x4) are solved faster and more accurately than comparable non-ties; advantage persists when encoding limited (access-based account).
    - Source: https://escholarship.org/content/qt35458505/qt35458505.pdf
    - Publisher: eScholarship (likely CogSci proceedings)
    - pub_date: n.d. (not confirmed)
    - Confidence: high (effect). Class: feature

12. **Claim:** Carry effect in multi-digit addition has two components: categorical (carry needed or not) and continuous (size of unit sum); eye-tracking shows longer unit-digit reading in carry trials (adults and 3rd graders).
    - Source: https://behavioralandbrainfunctions.biomedcentral.com/articles/10.1186/1744-9081-6-70/tables/1 (Klein et al. 2010, Behavioral and Brain Functions)
    - Publisher: BioMed Central, peer-reviewed
    - pub_date: 2010
    - Confidence: high (qualitative); RT magnitudes not retrieved. Class: feature

13. **Claim:** Difficulty (human RT and model steps) strictly increases with number of carries; increases more steeply for subtraction (borrows) than addition.
    - Source: https://arxiv.org/abs/1905.03617 (Cho et al., ICCM 2019)
    - Publisher: arXiv / ICCM proceedings (likely refereed; binary-number task)
    - pub_date: 2019
    - Confidence: med. Class: computational model

14. **Claim:** Even skilled adults use procedures (not retrieval) for larger simple subtraction and division problems; non-Asian Canadians relied more on procedures. Implies subtraction/division > addition/multiplication in difficulty at matched size.
    - Source: https://pubmed.ncbi.nlm.nih.gov/11409105 (Campbell & Xue 2001, JEP: General)
    - Publisher: APA, peer-reviewed
    - pub_date: 2001
    - Confidence: med (operation ordering inferred from abstract). Class: operation effect

15. **Claim:** Negative numbers: comparisons with negative pairs are slower than positive pairs (familiarity/lack of referents). For integer add/sub, students do worse on subtraction (46-69% correct) than addition (74-78%) (Murray 1985); problem types (all-negatives, change-positive, counterintuitive) affect performance (Lamb et al., JRME 49(5)).
    - Source: https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2012.00007/full ; https://par.nsf.gov/servlets/purl/10407298 ; https://simplyspeaking.usm.my/index.php/category/education/98-students-difficulties-in-integer-operations
    - Publisher: Frontiers (peer-reviewed); NSF PAR (author manuscripts); USM blog
    - pub_date: 2012; ~2018-2022; n.d.
    - Confidence: med (accuracy data secondary). Class: feature (sign)

16. **Claim:** Common Core 3.OA.C.7: fluently multiply and divide within 100; by end of Grade 3 know from memory all products of two one-digit numbers.
    - Source: https://www.thecorestandards.org/Math/Content/3/OA/
    - Publisher: CCSSI (NGA/CCSSO)
    - pub_date: 2010
    - Confidence: high. Class: curriculum anchor

## Implied feature set (synthesis, not a published formula)
operation (+ < x < - <= / at matched size); operand magnitude (sum/product/min); digits; carries/borrows count; ties (easier); "easy" multipliers 1,2,5,10 vs hard 7,8; presence/position of negative operands (subtraction of negatives / counterintuitive types hardest); calibrate weights via LLTM or Elo on real responses.

## Leads
- Klinkenberg, Straatemeier & van der Maas (2011) Computers & Education - Elo/RT scoring rule (high-speed high-stakes) in Math Garden.
- Math Garden dissertation full text: list of problem characteristics for add/sub/mult difficulty.
- van der Ven et al. 2015 full text: multidigit feature coding.
- Ashcraft 1992 & Zbrodoff & Logan 2005 full texts for RT slopes per operation.
- Pelanek (Masaryk Univ.) work on difficulty estimation in adaptive practice (Elo vs proportion-correct).
- Lamb et al. JRME 49(5) integer problem types difficulty ordering.
- LeFevre et al. on multiplication/division strategies; Campbell's division RT data.
- Carleton 2006-02 tech report (negatives in mixed add/sub problem-size) - PDF could not be parsed.
- Lifespan carry-effect dataset on PsychArchives (actual RT values).

## Looked for but not found
- A single standard/published difficulty score formula for a single equation a op b = c.
- Retrieved evidence for Groen & Parkman min model (search returned nothing relevant).
- Quantitative carry-effect RT magnitudes (ms) - not retrieved.
- Any "five effect" source (search found none).
- Direct RT studies of timed integer (negative-number) arithmetic; only comparison tasks and accuracy data.
- Australian/UK number-fact progression documents (not searched within budget).
