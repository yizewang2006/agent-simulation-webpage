package searchMethod;

import java.util.ArrayList;

public class modelTracker 
{
	public ArrayList<Integer> age_list = new ArrayList<Integer>();
	
	public ArrayList<Integer> ID_list = new ArrayList<Integer>();
	
	public int cross_over_count = 0;
	
	public int mutation_count = 0;
	
	public ArrayList<ArrayList<Integer>> gen_history =  new ArrayList<ArrayList<Integer>>(); 
	
	public modelTracker(ArrayList<Integer> age_l, ArrayList<Integer> ID_l, int cross_over_count, int mutation_count, ArrayList<ArrayList<Integer>> gen_his)
	{ 
		
		for (int i = 0; i < age_l.size(); i++)
		{
			age_list.add(age_l.get(i));
			ID_list.add(ID_l.get(i));
		}
		
		this.cross_over_count = cross_over_count;
		
		this.mutation_count = mutation_count;
		
		
		for (int i = 0; i < gen_his.size(); i ++)
		{
			ArrayList<Integer> temp = new ArrayList<Integer>();

			for (int d : gen_his.get(i))
			{
				temp.add(d);
			}
			
			gen_history.add(temp);
		}
	}
}
