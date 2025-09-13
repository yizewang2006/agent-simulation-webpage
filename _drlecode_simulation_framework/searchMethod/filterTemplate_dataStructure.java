package searchMethod;

import java.util.ArrayList;

import filters.Filter;

//Search space should contain a list of filters for each filter property
public class filterTemplate_dataStructure 
{
	
	public double filter_property = 0;
	
	public ArrayList<Filter> filter_template_option = new ArrayList<Filter>();
	
	public filterTemplate_dataStructure (double f_property, ArrayList<Filter> f_chain)
	{
		this.filter_property = f_property;
		
		for (Filter f : f_chain)
		{
			filter_template_option.add(f);
		}
	}
}
