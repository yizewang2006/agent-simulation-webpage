package Activation;

import java.util.ArrayList;

public class CategoryCriteria extends Activation_criteria
{
	//For category property
	public ArrayList<Double> check_set = new ArrayList<Double>();
	
	public CategoryCriteria(ArrayList<Double> check_s)
	{
		for (Double d: check_s)
		{
			check_set.add(d);
		}
	}
}
 