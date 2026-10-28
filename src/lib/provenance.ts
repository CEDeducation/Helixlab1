import type {SequenceFeature} from './types';
/** Preserve known source warnings when updating a derived sequence record.
 * The exact original upload remains archived separately as the authoritative
 * file; this helper does not certify the scientific accuracy of an edit. */
export function editableSequencePayload(
 sequence:string,topology:'Circular'|'Linear',features:SequenceFeature[],
 existingWarnings:readonly string[]=[]
):Record<string,unknown>{
 const warnings=existingWarnings.filter(w=>typeof w==='string'&&w.length>0);
 return {sequence,topology,features,...(warnings.length?{warnings} : {})};
}
